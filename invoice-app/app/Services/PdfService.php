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
}