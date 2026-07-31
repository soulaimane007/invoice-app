<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Devis;
use App\Models\Facture;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DevisService
{
    public function __construct(
        private readonly ClientService $clientService,
        private readonly FactureService $factureService,
        private readonly SousClientService $sousClientService,
        private readonly ReferenceGeneratorService $referenceGenerator,
        private readonly ArticleService $articleService,
    ) {
    }

    public function peekNextReference(): array
    {
        return $this->referenceGenerator->peekNext('devis');
    }

    public function setNextReferenceNumber(int $number): array
    {
        return $this->referenceGenerator->setNextNumber('devis', $number);
    }

    private function resolveReference(?int $requestedNumber): array
    {
        if ($requestedNumber === null) {
            return $this->referenceGenerator->next('devis');
        }

        $this->referenceGenerator->ensureCounterAtLeast('devis', $requestedNumber);

        return [
            'reference' => $this->referenceGenerator->buildFromNumber('devis', $requestedNumber),
            'number' => $requestedNumber,
        ];
    }

    public function create(array $data): Devis
    {
        return DB::transaction(function () use ($data) {
            $client = $this->clientService->findOrCreate($data['client']);
            $sousClient = $this->sousClientService->findOrCreate($client->id, $data['sous_client'] ?? null);
            $refData = $this->resolveReference($data['reference_number'] ?? null);

            $devis = Devis::create([
                'user_id' => $data['user_id'] ?? null,
                'client_id' => $client->id,
                'sous_client_id' => $sousClient?->id,
                'reference' => $refData['reference'],
                'reference_number' => $refData['number'],
                'date' => $data['date'] ?? now()->toDateString(),
                'status' => $data['status'] ?? 'draft',
                'comment' => $data['comment'] ?? null,
                'client_name' => $client->name,
                'client_address' => $client->address,
                'client_phone' => $client->phone,
                'client_email' => $client->email,
                'client_ice' => $client->ice,
                'sous_client_name' => $sousClient?->name,
                'sous_client_reference' => $sousClient?->reference,
            ]);

            $this->syncLines($devis, $data['lines'] ?? []);
            $this->recalculateTotals($devis);

            return $devis->fresh('lignes');
        });
    }

    public function update(Devis $devis, array $data): Devis
    {
        if ($devis->is_converted) {
            throw new RuntimeException('This quotation was already converted to an invoice and can no longer be edited.');
        }

        return DB::transaction(function () use ($devis, $data) {
            if (isset($data['client'])) {
                $client = $this->clientService->findOrCreate($data['client']);
                $devis->client_id = $client->id;
                $devis->client_name = $client->name;
                $devis->client_address = $client->address;
                $devis->client_phone = $client->phone;
                $devis->client_email = $client->email;
                $devis->client_ice = $client->ice;
            }

            if (array_key_exists('sous_client', $data)) {
                $sousClient = $this->sousClientService->findOrCreate($devis->client_id, $data['sous_client']);
                $devis->sous_client_id = $sousClient?->id;
                $devis->sous_client_name = $sousClient?->name;
                $devis->sous_client_reference = $sousClient?->reference;
            }

            if (array_key_exists('reference_number', $data) && $data['reference_number'] !== null) {
                $refData = $this->resolveReference((int) $data['reference_number']);
                $devis->reference = $refData['reference'];
                $devis->reference_number = $refData['number'];
            }

            $devis->fill([
                'date' => $data['date'] ?? $devis->date,
                'status' => $data['status'] ?? $devis->status,
                'comment' => $data['comment'] ?? $devis->comment,
            ])->save();

            if (isset($data['lines'])) {
                $devis->lignes()->delete();
                $this->syncLines($devis, $data['lines']);
            }

            $this->recalculateTotals($devis);

            return $devis->fresh('lignes');
        });
    }

    public function convertToFacture(Devis $devis, array $overrides = []): array
    {
        if ($devis->is_converted) {
            throw new RuntimeException('This quotation has already been converted.');
        }

        return DB::transaction(function () use ($devis, $overrides) {
            $result = $this->factureService->createFromDevis($devis, $overrides);

            $devis->update(['converted_to_facture_id' => $result['facture']->id]);

            return $result;
        });
    }

    private function syncLines(Devis $devis, array $lines): void
    {
        foreach ($lines as $index => $line) {
            $quantity = (float) ($line['quantity'] ?? 1);
            $unitPrice = (float) ($line['unit_price'] ?? 0);
            $tvaRate = (float) ($line['tva_rate'] ?? 20);
            $description = $line['description'] ?? '';
            $unit = $line['unit'] ?? null;
            $isService = (bool) ($line['is_service'] ?? false);

            $totalHt = $quantity * $unitPrice;
            $totalTtc = $totalHt * (1 + $tvaRate / 100);

            // A service line never gets linked to (or creates) a catalogue
            // article — that's the whole point of marking it as a service.
            $articleId = $isService ? null : ($line['article_id'] ?? null);
            if (! $isService && ! $articleId && trim($description) !== '') {
                $articleId = $this->articleService->findOrCreate($description, $unitPrice, $tvaRate, $unit)->id;
            }
            if (! $unit && $articleId) {
                $unit = Article::find($articleId)?->unit;
            }

            $devis->lignes()->create([
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
        }
    }

    private function recalculateTotals(Devis $devis): void
    {
        $lines = $devis->lignes()->get();

        $devis->update([
            'subtotal' => round($lines->sum('total_ht'), 2),
            'tax_total' => round($lines->sum(fn ($l) => $l->total_ttc - $l->total_ht), 2),
            'total' => round($lines->sum('total_ttc'), 2),
        ]);
    }
}