<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FactureRequest;
use App\Http\Resources\FactureResource;
use App\Models\Facture;
use App\Services\FactureService;
use App\Services\PdfService;
use Illuminate\Http\Request;

class FactureController extends Controller
{
    public function __construct(
        private readonly FactureService $factureService,
        private readonly PdfService $pdfService,
    ) {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Facture::class);

        $sortable = ['date', 'reference', 'total', 'amount_paid', 'payment_status', 'due_date', 'created_at'];
        $sortBy = in_array($request->query('sort_by'), $sortable, true) ? $request->query('sort_by') : 'date';
        $sortDir = $request->query('sort_dir') === 'asc' ? 'asc' : 'desc';

        $factures = Facture::with('client')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->query('search').'%';
                $q->where(function ($sub) use ($term) {
                    $sub->where('reference', 'like', $term)
                        ->orWhere('client_name', 'like', $term)
                        ->orWhere('sous_client_name', 'like', $term)
                        ->orWhere('sous_client_reference', 'like', $term);
                });
            })
            ->when($request->filled('client_id'), fn ($q) => $q->where('client_id', $request->query('client_id')))
            ->when($request->filled('sous_client_id'), fn ($q) => $q->where('sous_client_id', $request->query('sous_client_id')))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->query('payment_status')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('date', '>=', $request->query('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('date', '<=', $request->query('date_to')))
            ->orderBy($sortBy, $sortDir)
            ->paginate(min($request->integer('per_page', 10), 100));

        return FactureResource::collection($factures);
    }

    public function nextReference()
    {
        $this->authorize('viewAny', Facture::class);

        return response()->json($this->factureService->peekNextReference());
    }

public function setNextReference(Request $request)
    {
        $this->authorize('create', Facture::class);

        $validated = $request->validate([
            'number' => [
                'required', 'integer', 'min:1',
                function ($attribute, $value, $fail) {
                    $generator = app(\App\Services\ReferenceGeneratorService::class);
                    $reference = $generator->buildFromNumber('facture', (int) $value);
                    if ($generator->exists('facture', $reference)) {
                        $fail("La référence \"{$reference}\" existe déjà.");
                    }
                },
            ],
        ]);

        return response()->json($this->factureService->setNextReferenceNumber($validated['number']));
    }

    public function store(FactureRequest $request)    {
        $this->authorize('create', Facture::class);

        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $result = $this->factureService->create($data);

        return (new FactureResource($result['facture']->load(['client', 'lignes.article', 'lignes.matricules'])))
            ->additional(['stock_warnings' => $result['warnings']]);
    }

    public function show(Facture $facture)
    {
        $this->authorize('view', $facture);

        return new FactureResource($facture->load(['client', 'lignes.article', 'lignes.matricules', 'devis']));
    }

    public function update(FactureRequest $request, Facture $facture)
    {
        $this->authorize('update', $facture);

        $result = $this->factureService->update($facture, $request->validated());

        return (new FactureResource($result['facture']->load(['client', 'lignes.article', 'lignes.matricules'])))
            ->additional(['stock_warnings' => $result['warnings']]);
    }

    public function destroy(Facture $facture)
    {
        $this->authorize('delete', $facture);

        $this->factureService->delete($facture);

        return response()->json(['message' => 'Invoice deleted.']);
    }

    public function recordPayment(Request $request, Facture $facture)
    {
        $this->authorize('update', $facture);

        $validated = $request->validate([
            'payment_status' => ['required', 'in:unpaid,partial,paid'],
            'amount_paid' => ['required', 'numeric', 'min:0'],
        ]);

        $result = $this->factureService->recordPayment($facture, $validated['payment_status'], $validated['amount_paid']);

        return new FactureResource($result['facture']->load(['client', 'lignes.article', 'lignes.matricules']));
    }

    public function downloadPdf(Facture $facture)
    {
        $this->authorize('view', $facture);

        return $this->pdfService->facture($facture)->download("{$facture->reference}.pdf");
    }
}