<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DocumentTemplateRequest;
use App\Http\Resources\DocumentTemplateResource;
use App\Models\DocumentTemplate;
use App\Services\AuditLogService;
use App\Services\TemplateRendererService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DocumentTemplateController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    public function index(Request $request)
    {
        $validated = $request->validate(['document_type' => ['required', 'in:devis,facture']]);

        $templates = DocumentTemplate::where('document_type', $validated['document_type'])
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        return DocumentTemplateResource::collection($templates);
    }

    /**
     * Renders the CURRENT, possibly-unsaved editor content against
     * realistic fake data, using the exact same TemplateRendererService
     * the real PDF download uses — so preview and the actual downloaded
     * document can never quietly diverge from one another.
     */
    public function preview(Request $request, TemplateRendererService $renderer)
    {
        $validated = $request->validate([
            'document_type' => ['required', 'in:devis,facture'],
            'content' => ['required', 'string'],
        ]);

        $fakeDocument = $this->buildFakeDocument($validated['document_type']);
        $html = $renderer->render($validated['content'], $fakeDocument, $validated['document_type']);

        return response()->json(['html' => $html]);
    }

    public function store(DocumentTemplateRequest $request)
    {
        $validated = $request->validated();
        $organizationId = $request->user()->organizationId();

        $template = DB::transaction(function () use ($validated, $organizationId) {
            if (! empty($validated['is_default'])) {
                DocumentTemplate::where('organization_id', $organizationId)
                    ->where('document_type', $validated['document_type'])
                    ->update(['is_default' => false]);
            }

            return DocumentTemplate::create([
                'organization_id' => $organizationId,
                'document_type' => $validated['document_type'],
                'page_format' => $validated['page_format'] ?? 'A4',
                'name' => $validated['name'],
                'content' => $validated['content'],
                'is_default' => $validated['is_default'] ?? false,
            ]);
        });

        $this->auditLog->log($organizationId, 'template.created', $template, $template->name, ['document_type' => $template->document_type]);

        return new DocumentTemplateResource($template);
    }

    public function show(DocumentTemplate $documentTemplate)
    {
        return new DocumentTemplateResource($documentTemplate);
    }

    public function update(DocumentTemplateRequest $request, DocumentTemplate $documentTemplate)
    {
        $validated = $request->validated();
        $organizationId = $request->user()->organizationId();

        DB::transaction(function () use ($validated, $documentTemplate, $organizationId) {
            if (! empty($validated['is_default'])) {
                DocumentTemplate::where('organization_id', $organizationId)
                    ->where('document_type', $validated['document_type'])
                    ->where('id', '!=', $documentTemplate->id)
                    ->update(['is_default' => false]);
            }

            $documentTemplate->update($validated);
        });

        $this->auditLog->log($organizationId, 'template.updated', $documentTemplate, $documentTemplate->name);

        return new DocumentTemplateResource($documentTemplate->fresh());
    }

    public function destroy(Request $request, DocumentTemplate $documentTemplate)
    {
        $name = $documentTemplate->name;
        $documentTemplate->delete();

        $this->auditLog->log($request->user()->organizationId(), 'template.deleted', null, $name);

        return response()->json(['message' => 'Template deleted.']);
    }

    public function export(DocumentTemplate $documentTemplate)
    {
        // Nothing organization-specific lives inside a template's content
        // — every variable is a universal key resolved at render time
        // against WHICHEVER organization's real data is being used — so
        // the file is fully portable as-is, no stripping/rewriting needed.
        $payload = [
            'app' => 'invoiceapp-template',
            'version' => 1,
            'document_type' => $documentTemplate->document_type,
            'page_format' => $documentTemplate->page_format,
            'name' => $documentTemplate->name,
            'content' => $documentTemplate->content,
        ];

        $filename = Str::slug($documentTemplate->name).'.json';

        return response()->json($payload, 200, [
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function import(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'max:2048']]);

        $raw = file_get_contents($request->file('file')->getRealPath());
        $data = json_decode($raw, true);

        if (! is_array($data) || ($data['app'] ?? null) !== 'invoiceapp-template') {
            return response()->json(['message' => "Ce fichier n'est pas un modèle InvoiceApp valide."], 422);
        }

        $validator = Validator::make($data, [
            'document_type' => ['required', 'in:devis,facture'],
            'page_format' => ['nullable', 'in:A4,Letter,Legal'],
            'name' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Le fichier du modèle est invalide.', 'errors' => $validator->errors()], 422);
        }

        $organizationId = $request->user()->organizationId();

        // Never fail an import over a name collision — silently find the
        // next free name instead, since re-numbering is harmless and a
        // hard validation error here would be a frustrating dead end.
        $name = $data['name'];
        $suffix = 1;
        while (DocumentTemplate::where('organization_id', $organizationId)->where('document_type', $data['document_type'])->where('name', $name)->exists()) {
            $suffix++;
            $name = $data['name']." ({$suffix})";
        }

        $template = DocumentTemplate::create([
            'organization_id' => $organizationId,
            'document_type' => $data['document_type'],
            'page_format' => $data['page_format'] ?? 'A4',
            'name' => $name,
            'content' => $data['content'],
            'is_default' => false,
        ]);

        $this->auditLog->log($organizationId, 'template.imported', $template, $template->name);

        return new DocumentTemplateResource($template);
    }

    private function buildFakeDocument(string $documentType): object
    {
        $document = new \stdClass();
        $document->client_name = 'Société Exemple SARL';
        $document->client_address = '45 Rue Example, Rabat';
        $document->client_phone = '0537 00 00 00';
        $document->client_email = 'client@exemple.ma';
        $document->client_ice = '000111222333444';
        $document->sous_client_name = 'Véhicule Exemple';
        $document->sous_client_reference = '12345-A-6';
        $document->reference = $documentType === 'devis' ? 'DEV-2026-000123' : 'FAC-2026-000123';
        $document->date = now();
        $document->comment = 'Merci de régler sous 30 jours.';
        $document->currency = 'MAD';
        $document->subtotal = 2500;
        $document->tax_total = 500;
        $document->total = 3000;

        if ($documentType === 'devis') {
            $document->status = 'sent';
        } else {
            $document->due_date = now()->addDays(30);
            $document->payment_status = 'partial';
            $document->amount_paid = 1500;
            $document->remaining_balance = 1500;
        }

        $document->lignes = collect([
            $this->fakeLine('Prestation de service A', 2, 'Unité', 500, 20, 1000, ['ABC-001', 'ABC-002']),
            $this->fakeLine('Produit B', 5, 'Pièce', 200, 20, 1000, []),
            $this->fakeLine('Prestation C', 1, 'Heure', 500, 20, 500, []),
        ]);

        return $document;
    }

    private function fakeLine(string $description, float $quantity, string $unit, float $unitPrice, float $tvaRate, float $totalHt, array $matricules): object
    {
        $line = new \stdClass();
        $line->description = $description;
        $line->quantity = $quantity;
        $line->unit = $unit;
        $line->unit_price = $unitPrice;
        $line->tva_rate = $tvaRate;
        $line->total_ht = $totalHt;
        $line->total_ttc = $totalHt * (1 + $tvaRate / 100);
        $line->matricules = collect(array_map(fn ($m) => (object) ['matricule' => $m], $matricules));

        return $line;
    }
}