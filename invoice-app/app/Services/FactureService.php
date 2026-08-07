<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Devis;
use App\Models\Facture;
use Illuminate\Support\Facades\DB;

class FactureService
{
    public function __construct(
        private readonly ClientService $clientService,
        private readonly ArticleService $articleService,
        private readonly SousClientService $sousClientService,
        private readonly ArticleMatriculeService $articleMatriculeService,
        private readonly ReferenceGeneratorService $referenceGenerator,
    ) {
    }

    public function peekNextReference(): array
    {
        return $this->referenceGenerator->peekNext('facture');
    }

    public function setNextReferenceNumber(int $number): array
    {
        return $this->referenceGenerator->setNextNumber('facture', $number);
    }

    private function resolveReference(?int $requestedNumber): array
    {
        if ($requestedNumber === null) {
            return $this->referenceGenerator->next('facture');
        }

        $this->referenceGenerator->ensureCounterAtLeast('facture', $requestedNumber);

        return [
            'reference' => $this->referenceGenerator->buildFromNumber('facture', $requestedNumber),
            'number' => $requestedNumber,
        ];
    }

    public function create(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $client = $this->clientService->findOrCreate($data['client']);
            $sousClient = $this->sousClientService->findOrCreate($client->id, $data['sous_client'] ?? null);
            $refData = $this->resolveReference($data['reference_number'] ?? null);

            $facture = Facture::create([
                'user_id' => $data['user_id'] ?? null,
                'client_id' => $client->id,
                'sous_client_id' => $sousClient?->id,
                'devis_id' => $data['devis_id'] ?? null,
                'reference' => $refData['reference'],
                'reference_number' => $refData['number'],
                'date' => $data['date'] ?? now()->toDateString(),
                'due_date' => $data['due_date'] ?? null,
                'comment' => $data['comment'] ?? null,
                'client_name' => $client->name,
                'client_address' => $client->address,
                'client_phone' => $client->phone,
                'client_email' => $client->email,
                'client_ice' => $client->ice,
                'sous_client_name' => $sousClient?->name,
                'sous_client_reference' => $sousClient?->reference,
            ]);

            $warnings = $this->syncLines($facture, $data['lines'] ?? []);
            $this->recalculateTotals($facture);

            return ['facture' => $facture->fresh(['lignes', 'lignes.matricules']), 'warnings' => $warnings];
        });
    }

    public function createFromDevis(Devis $devis, array $overrides = []): array
    {
        return DB::transaction(function () use ($devis, $overrides) {
            $devis->loadMissing(['lignes.article']);
            $refData = $this->resolveReference(isset($overrides['reference_number']) ? (int) $overrides['reference_number'] : null);

            $facture = Facture::create([
                'user_id' => $overrides['user_id'] ?? $devis->user_id,
                'client_id' => $devis->client_id,
                'sous_client_id' => $devis->sous_client_id,
                'devis_id' => $devis->id,
                'reference' => $refData['reference'],
                'reference_number' => $refData['number'],
                'date' => $overrides['date'] ?? now()->toDateString(),
                'due_date' => $overrides['due_date'] ?? null,
                'comment' => $devis->comment,
                'client_name' => $devis->client_name,
                'client_address' => $devis->client_address,
                'client_phone' => $devis->client_phone,
                'client_email' => $devis->client_email,
                'client_ice' => $overrides['client_ice'] ?? $devis->client_ice,
                'sous_client_name' => $devis->sous_client_name,
                'sous_client_reference' => $devis->sous_client_reference,
                'subtotal' => $devis->subtotal,
                'tax_total' => $devis->tax_total,
                'total' => $devis->total,
                'currency' => $devis->currency,
            ]);

            $warnings = [];
            $lineMatricules = $overrides['line_matricules'] ?? [];

            foreach ($devis->lignes as $line) {
                $isService = (bool) $line->is_service;

                $factureLine = $facture->lignes()->create([
                    'article_id' => $isService ? null : $line->article_id,
                    'description' => $line->description,
                    'unit' => $line->unit,
                    'is_service' => $isService,
                    'quantity' => $line->quantity,
                    'unit_price' => $line->unit_price,
                    'tva_rate' => $line->tva_rate,
                    'total_ht' => $line->total_ht,
                    'total_ttc' => $line->total_ttc,
                    'sort_order' => $line->sort_order,
                ]);

                $article = $isService ? null : $line->article;
                if (! $isService && ! $article && trim($line->description) !== '') {
                    $article = $this->articleService->findOrCreate($line->description, $line->unit_price, $line->tva_rate, $line->unit);
                    $factureLine->update(['article_id' => $article->id]);
                }

                if ($article) {
                    $availableBefore = $article->quantity_in_stock;
                    $sufficient = $this->articleService->decrementStock($article, $line->quantity);
                    if (! $sufficient) {
                        $warnings[] = $this->buildStockWarning($article->name, (float) $line->quantity, (float) $availableBefore);
                    }

                    $matricules = $lineMatricules[$line->id] ?? [];
                    if (! empty($matricules)) {
                        $this->articleMatriculeService->attachToLine($factureLine, $article->id, $matricules);
                    }
                }
            }

            return ['facture' => $facture->fresh(['lignes', 'lignes.matricules']), 'warnings' => $warnings];
        });
    }

    public function update(Facture $facture, array $data): array
    {
        return DB::transaction(function () use ($facture, $data) {
            if (isset($data['client'])) {
                $client = $this->clientService->findOrCreate($data['client']);
                $facture->client_id = $client->id;
                $facture->client_name = $client->name;
                $facture->client_address = $client->address;
                $facture->client_phone = $client->phone;
                $facture->client_email = $client->email;
                $facture->client_ice = $client->ice;
            }

            if (array_key_exists('sous_client', $data)) {
                $sousClient = $this->sousClientService->findOrCreate($facture->client_id, $data['sous_client']);
                $facture->sous_client_id = $sousClient?->id;
                $facture->sous_client_name = $sousClient?->name;
                $facture->sous_client_reference = $sousClient?->reference;
            }

            if (array_key_exists('reference_number', $data) && $data['reference_number'] !== null) {
                $refData = $this->resolveReference((int) $data['reference_number']);
                $facture->reference = $refData['reference'];
                $facture->reference_number = $refData['number'];
            }

            $facture->fill([
                'date' => $data['date'] ?? $facture->date,
                'due_date' => $data['due_date'] ?? $facture->due_date,
                'payment_status' => $data['payment_status'] ?? $facture->payment_status,
                'amount_paid' => $data['amount_paid'] ?? $facture->amount_paid,
                'comment' => $data['comment'] ?? $facture->comment,
            ])->save();

            $warnings = [];

            if (isset($data['lines'])) {
                foreach ($facture->lignes()->get() as $oldLine) {
                    if ($oldLine->article_id && $oldLine->article) {
                        $this->articleService->restoreStock($oldLine->article, $oldLine->quantity);
                    }
                    $this->articleMatriculeService->releaseFromLine($oldLine);
                }

                $facture->lignes()->delete();
                $warnings = $this->syncLines($facture, $data['lines']);
            }

            $this->recalculateTotals($facture);

            return ['facture' => $facture->fresh(['lignes', 'lignes.matricules']), 'warnings' => $warnings];
        });
    }

    public function recordPayment(Facture $facture, string $paymentStatus, float $amountPaid): array
    {
        $facture->update(['payment_status' => $paymentStatus, 'amount_paid' => $amountPaid]);

        return ['facture' => $facture->fresh(['lignes', 'lignes.matricules']), 'warnings' => []];
    }

    public function delete(Facture $facture): void
    {
        DB::transaction(function () use ($facture) {
            foreach ($facture->lignes()->get() as $line) {
                if ($line->article_id && $line->article) {
                    $this->articleService->restoreStock($line->article, $line->quantity);
                }
                $this->articleMatriculeService->releaseFromLine($line);
            }

            $facture->delete();
        });
    }

    private function syncLines(Facture $facture, array $lines): array
    {
        $warnings = [];

        foreach ($lines as $index => $line) {
            $unitPrice = (float) ($line['unit_price'] ?? 0);
            $tvaRate = (float) ($line['tva_rate'] ?? 20);
            $description = $line['description'] ?? '';
            $unit = $line['unit'] ?? null;
            $isService = (bool) ($line['is_service'] ?? false);

            // Same rule as DevisService — a service is stored with a
            // genuinely NULL quantity, and its total is the price alone.
            $quantity = $isService ? null : (float) ($line['quantity'] ?? 1);
            $totalHt = $isService ? $unitPrice : $quantity * $unitPrice;
            $totalTtc = $totalHt * (1 + $tvaRate / 100);

            $articleId = $isService ? null : ($line['article_id'] ?? null);
            if (! $isService && ! $articleId && trim($description) !== '') {
                $articleId = $this->articleService->findOrCreate($description, $unitPrice, $tvaRate, $unit)->id;
            } elseif (! $isService && $articleId && ! empty($line['rename_article']) && trim($description) !== '') {
                // Explicit opt-in only — set when the user picked "Modifier
                // l'article existant" in the confirmation modal. Renames the
                // shared catalogue record itself, which is why this never
                // happens silently just because a line's text changed.
                Article::where('id', $articleId)->update(['name' => trim($description)]);
            }
            if (! $unit && $articleId) {
                $unit = Article::find($articleId)?->unit;
            }

            $factureLine = $facture->lignes()->create([
                'article_id' => $articleId,
                'description' => $description,
                'unit' => $unit ?: 'Unité',
                'is_service' => $isService,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'tva_rate' => $tvaRate,
                'total_ht' => round($totalHt, 2),
                'total_ttc' => round($totalTtc, 2),
                'sort_order' => $index,
            ]);

            if ($factureLine->article_id && $factureLine->article) {
                $availableBefore = $factureLine->article->quantity_in_stock;
                $sufficient = $this->articleService->decrementStock($factureLine->article, $quantity);
                if (! $sufficient) {
                    $warnings[] = $this->buildStockWarning($factureLine->article->name, $quantity, (float) $availableBefore);
                }
            }

            if ($factureLine->article_id && ! empty($line['matricules'])) {
                $this->articleMatriculeService->attachToLine($factureLine, $factureLine->article_id, $line['matricules']);
            }
        }

        return $warnings;
    }

    private function buildStockWarning(string $articleName, float $requested, float $availableBefore): array
    {
        return [
            'article' => $articleName,
            'requested' => $requested,
            'available_before' => max(0, $availableBefore),
            'resulting_stock' => $availableBefore - $requested,
        ];
    }

    private function recalculateTotals(Facture $facture): void
    {
        $lines = $facture->lignes()->get();

        $facture->update([
            'subtotal' => round($lines->sum('total_ht'), 2),
            'tax_total' => round($lines->sum(fn ($l) => $l->total_ttc - $l->total_ht), 2),
            'total' => round($lines->sum('total_ttc'), 2),
        ]);
    }
}