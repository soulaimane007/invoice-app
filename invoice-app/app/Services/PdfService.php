<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\Devis;
use App\Models\Facture;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfService
{
    public function devis(Devis $devis)
    {
        $devis->loadMissing(['lignes.article']);

        return Pdf::loadView('pdf.devis', [
            'devis' => $devis,
            'company' => CompanySetting::current(),
        ])->setPaper('a4', 'portrait');
    }

    public function facture(Facture $facture)
    {
        $facture->loadMissing(['lignes.article']);

        return Pdf::loadView('pdf.facture', [
            'facture' => $facture,
            'company' => CompanySetting::current(),
        ])->setPaper('a4', 'portrait');
    }
public function devisWithTemplate(\App\Models\Devis $devis, \App\Models\DocumentTemplate $template): \Illuminate\Http\Response
    {
        $renderer = app(\App\Services\TemplateRendererService::class);
        $renderedContent = $renderer->render($template->content, $devis, 'devis');

        return $this->renderCustomTemplateAsPdf($renderedContent, $template->page_format ?? 'A4', "{$devis->reference}.pdf");
    }

    public function factureWithTemplate(\App\Models\Facture $facture, \App\Models\DocumentTemplate $template): \Illuminate\Http\Response
    {
        $renderer = app(\App\Services\TemplateRendererService::class);
        $renderedContent = $renderer->render($template->content, $facture, 'facture');

        return $this->renderCustomTemplateAsPdf($renderedContent, $template->page_format ?? 'A4', "{$facture->reference}.pdf");
    }

    public function bulkWithTemplate($documents, \App\Models\DocumentTemplate $template, string $documentType, string $filename): \Illuminate\Http\Response
    {
        $renderer = app(\App\Services\TemplateRendererService::class);
        $documents = $documents->values();
        $lastIndex = $documents->count() - 1;

        $combined = $documents->map(function ($document, $index) use ($renderer, $template, $documentType, $lastIndex) {
            $rendered = $renderer->render($template->content, $document, $documentType);
            $style = $index < $lastIndex ? ' style="page-break-after: always;"' : '';

            return "<div{$style}>{$rendered}</div>";
        })->implode('');

        return $this->renderCustomTemplateAsPdf($combined, $template->page_format ?? 'A4', $filename);
    }

    /**
     * Renders via an actual headless Chrome browser (Browsershot/Puppeteer)
     * instead of dompdf — the SAME rendering engine that shows the live
     * editor and Aperçu, using the exact same Blade view and shared
     * stylesheet. This is what makes the download structurally match what
     * you see on screen, rather than approximate it.
     */
    private function renderCustomTemplateAsPdf(string $renderedContent, string $pageFormat, string $filename): \Illuminate\Http\Response
    {
        $fullHtml = view('pdf.custom-template', [
            'renderedContent' => $renderedContent,
            'pageFormat' => $pageFormat,
        ])->render();

        $pdfContent = \Spatie\Browsershot\Browsershot::html($fullHtml)
            ->newHeadless()
            ->noSandbox()
            ->showBackground()
            ->format($pageFormat)
            ->margins(0, 0, 0, 0)
            ->timeout(60)
            ->pdf();

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}