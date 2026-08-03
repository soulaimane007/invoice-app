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
public function devisWithTemplate(\App\Models\Devis $devis, \App\Models\DocumentTemplate $template)
    {
        $renderer = app(\App\Services\TemplateRendererService::class);
        $renderedContent = $renderer->render($template->content, $devis, 'devis');

        return Pdf::loadView('pdf.custom-template', [
            'renderedContent' => $renderedContent,
            'pageFormat' => $template->page_format ?? 'A4',
        ]);
    }

    public function factureWithTemplate(\App\Models\Facture $facture, \App\Models\DocumentTemplate $template)
    {
        $renderer = app(\App\Services\TemplateRendererService::class);
        $renderedContent = $renderer->render($template->content, $facture, 'facture');

        return Pdf::loadView('pdf.custom-template', [
            'renderedContent' => $renderedContent,
            'pageFormat' => $template->page_format ?? 'A4',
        ]);
    }

    public function bulkWithTemplate($documents, \App\Models\DocumentTemplate $template, string $documentType)
    {
        $renderer = app(\App\Services\TemplateRendererService::class);
        $documents = $documents->values();
        $lastIndex = $documents->count() - 1;

        $combined = $documents->map(function ($document, $index) use ($renderer, $template, $documentType, $lastIndex) {
            $rendered = $renderer->render($template->content, $document, $documentType);
            $style = $index < $lastIndex ? ' style="page-break-after: always;"' : '';

            return "<div{$style}>{$rendered}</div>";
        })->implode('');

        return Pdf::loadView('pdf.custom-template', [
            'renderedContent' => $combined,
            'pageFormat' => $template->page_format ?? 'A4',
        ]);
    }
}