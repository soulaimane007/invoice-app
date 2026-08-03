<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DevisRequest;
use App\Http\Resources\DevisResource;
use App\Http\Resources\FactureResource;
use App\Models\Devis;
use App\Services\AuditLogService;
use App\Services\DevisService;
use App\Services\PdfService;
use App\Models\DocumentTemplate;
use App\Services\ReferenceGeneratorService;
use Illuminate\Http\Request;

class DevisController extends Controller
{
    public function __construct(
        private readonly DevisService $devisService,
        private readonly PdfService $pdfService,
        private readonly AuditLogService $auditLog,
    ) {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Devis::class);

        $sortable = ['date', 'reference', 'total', 'status', 'created_at'];
        $sortBy = in_array($request->query('sort_by'), $sortable, true) ? $request->query('sort_by') : 'date';
        $sortDir = $request->query('sort_dir') === 'asc' ? 'asc' : 'desc';

        $devis = Devis::with('client')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->query('search').'%';
                $q->where(function ($sub) use ($term) {
                    $sub->where('reference', 'like', $term)
                        ->orWhere('client_name', 'like', $term);
                });
            })
            ->when($request->filled('client_id'), fn ($q) => $q->where('client_id', $request->query('client_id')))
            ->when($request->filled('sous_client_id'), fn ($q) => $q->where('sous_client_id', $request->query('sous_client_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('date', '>=', $request->query('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('date', '<=', $request->query('date_to')))
            ->orderBy($sortBy, $sortDir)
            ->paginate(min($request->integer('per_page', 10), 100));

        return DevisResource::collection($devis);
    }

    public function nextReference()
    {
        $this->authorize('viewAny', Devis::class);

        return response()->json($this->devisService->peekNextReference());
    }

    public function setNextReference(Request $request)
    {
        $this->authorize('create', Devis::class);

        if (! $request->user()->hasPermission('can_edit_reference')) {
            abort(403, "You don't have permission to change reference numbers.");
        }

        $validated = $request->validate([
            'number' => [
                'required', 'integer', 'min:1',
                function ($attribute, $value, $fail) {
                    $generator = app(ReferenceGeneratorService::class);
                    $reference = $generator->buildFromNumber('devis', (int) $value);
                    if ($generator->exists('devis', $reference)) {
                        $fail("La référence \"{$reference}\" existe déjà.");
                    }
                },
            ],
        ]);

        return response()->json($this->devisService->setNextReferenceNumber($validated['number']));
    }

    public function store(DevisRequest $request)
    {
        $this->authorize('create', Devis::class);

        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $devis = $this->devisService->create($data);

        $this->auditLog->log($request->user()->organizationId(), 'devis.created', $devis, $devis->reference);

        return new DevisResource($devis->load(['client', 'lignes.article']));
    }

    public function show(Devis $devis)
    {
        $this->authorize('view', $devis);

        return new DevisResource($devis->load(['client', 'lignes.article', 'facture']));
    }

    public function update(DevisRequest $request, Devis $devis)
    {
        $this->authorize('update', $devis);

        if ($devis->status !== 'draft' && ! $request->user()->hasPermission('can_edit_after_sent')) {
            abort(403, "You don't have permission to edit a quotation once it's no longer a draft.");
        }

        $oldReferenceNumber = $devis->reference_number;
        $oldStatus = $devis->status;

        $devis = $this->devisService->update($devis, $request->validated());

        $metadata = [];
        if ($devis->reference_number !== $oldReferenceNumber) {
            $metadata['reference_changed'] = ['from' => $oldReferenceNumber, 'to' => $devis->reference_number];
        }
        if ($devis->status !== $oldStatus) {
            $metadata['status_changed'] = ['from' => $oldStatus, 'to' => $devis->status];
        }
        $this->auditLog->log($request->user()->organizationId(), 'devis.updated', $devis, $devis->reference, $metadata);

        return new DevisResource($devis->load(['client', 'lignes.article']));
    }

    public function destroy(Request $request, Devis $devis)
    {
        $this->authorize('delete', $devis);

        if (! $request->user()->hasPermission('can_delete_documents')) {
            abort(403, "You don't have permission to delete quotations.");
        }

        $reference = $devis->reference;
        $devis->delete();

        $this->auditLog->log($request->user()->organizationId(), 'devis.deleted', null, $reference);

        return response()->json(['message' => 'Quotation deleted.']);
    }

    public function duplicate(Request $request, Devis $devis)
    {
        $this->authorize('create', Devis::class);

        $copy = $this->devisService->create([
            'client' => ['id' => $devis->client_id],
            'sous_client' => $devis->sous_client_id ? ['id' => $devis->sous_client_id] : null,
            'date' => now()->toDateString(),
            'comment' => $devis->comment,
            'user_id' => $request->user()->id,
            'lines' => $devis->lignes->map(fn ($l) => [
                'article_id' => $l->article_id,
                'description' => $l->description,
                'unit' => $l->unit,
                'is_service' => $l->is_service,
                'quantity' => $l->quantity,
                'unit_price' => $l->unit_price,
                'tva_rate' => $l->tva_rate,
            ])->all(),
        ]);

        $this->auditLog->log($request->user()->organizationId(), 'devis.duplicated', $copy, $copy->reference, ['original_reference' => $devis->reference]);

        return new DevisResource($copy->load(['client', 'lignes.article']));
    }

    public function convert(Request $request, Devis $devis)
    {
        $this->authorize('update', $devis);

        if ($request->filled('reference_number') && ! $request->user()->hasPermission('can_edit_reference')) {
            abort(403, "You don't have permission to change reference numbers.");
        }

        $validated = $request->validate([
            'reference_number' => [
                'nullable', 'integer', 'min:1',
                function ($attribute, $value, $fail) {
                    if ($value === null) {
                        return;
                    }
                    $generator = app(ReferenceGeneratorService::class);
                    $reference = $generator->buildFromNumber('facture', (int) $value);
                    if ($generator->exists('facture', $reference)) {
                        $fail("La référence \"{$reference}\" est déjà utilisée par une autre facture.");
                    }
                },
            ],
            'client_ice' => ['nullable', 'string', 'max:30'],
            'date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'line_matricules' => ['nullable', 'array'],
            'line_matricules.*' => ['nullable', 'array'],
            'line_matricules.*.*' => ['nullable', 'string', 'max:100'],
        ]);

        $result = $this->devisService->convertToFacture($devis, $validated);

        $this->auditLog->log($request->user()->organizationId(), 'devis.converted', $devis, $devis->reference, ['facture_reference' => $result['facture']->reference]);

        return (new FactureResource($result['facture']->load(['client', 'lignes.article', 'lignes.matricules'])))
            ->additional(['stock_warnings' => $result['warnings']]);
    }

    public function bulkDownloadPdf(Request $request)
    {
        $this->authorize('viewAny', Devis::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'template_id' => ['required', 'integer'],
        ]);

        $devisList = Devis::whereIn('id', $validated['ids'])->get();
        foreach ($devisList as $devis) {
            $this->authorize('view', $devis);
        }

        $template = DocumentTemplate::where('document_type', 'devis')->findOrFail($validated['template_id']);

        return $this->pdfService->bulkWithTemplate($devisList, $template, 'devis')->download('devis.pdf');
    }

    public function downloadPdf(Request $request, Devis $devis)
    {
        $this->authorize('view', $devis);

        if ($request->filled('template_id')) {
            $template = DocumentTemplate::where('document_type', 'devis')->findOrFail($request->query('template_id'));

            return $this->pdfService->devisWithTemplate($devis, $template)->download("{$devis->reference}.pdf");
        }

        return $this->pdfService->devis($devis)->download("{$devis->reference}.pdf");
    }
}