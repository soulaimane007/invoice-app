<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CompanySettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_name' => $this->company_name,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'ice' => $this->ice,
            'logo_url' => $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null,
            'default_currency' => $this->default_currency,
            'default_tva_rate' => (float) $this->default_tva_rate,
            'show_unit_on_documents' => (bool) $this->show_unit_on_documents,
            'invoice_footer_note' => $this->invoice_footer_note,

            'devis_ref_prefix' => $this->devis_ref_prefix,
            'devis_ref_separator_1' => $this->devis_ref_separator_1,
            'devis_ref_include_year' => (bool) $this->devis_ref_include_year,
            'devis_ref_year_position' => $this->devis_ref_year_position,
            'devis_ref_number_digits' => (int) $this->devis_ref_number_digits,
            'devis_ref_separator_2' => $this->devis_ref_separator_2,
            'devis_ref_reset_yearly' => (bool) $this->devis_ref_reset_yearly,
            'devis_ref_start_number' => (int) $this->devis_ref_start_number,

            'facture_ref_prefix' => $this->facture_ref_prefix,
            'facture_ref_separator_1' => $this->facture_ref_separator_1,
            'facture_ref_include_year' => (bool) $this->facture_ref_include_year,
            'facture_ref_year_position' => $this->facture_ref_year_position,
            'facture_ref_number_digits' => (int) $this->facture_ref_number_digits,
            'facture_ref_separator_2' => $this->facture_ref_separator_2,
            'facture_ref_reset_yearly' => (bool) $this->facture_ref_reset_yearly,
            'facture_ref_start_number' => (int) $this->facture_ref_start_number,
        ];
    }
}