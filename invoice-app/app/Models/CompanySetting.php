<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CompanySetting extends Model
{
    use BelongsToOrganization;

    protected $table = 'company_settings';

    protected $fillable = [
        'organization_id', 'company_name', 'address', 'phone', 'email', 'ice', 'logo_path',
        'default_currency', 'default_tva_rate', 'show_unit_on_documents', 'invoice_footer_note',

        'devis_ref_prefix', 'devis_ref_separator_1', 'devis_ref_include_year', 'devis_ref_year_position',
        'devis_ref_number_digits', 'devis_ref_separator_2', 'devis_ref_reset_yearly', 'devis_ref_start_number',

        'facture_ref_prefix', 'facture_ref_separator_1', 'facture_ref_include_year', 'facture_ref_year_position',
        'facture_ref_number_digits', 'facture_ref_separator_2', 'facture_ref_reset_yearly', 'facture_ref_start_number',
    ];

    protected $casts = [
        'default_tva_rate' => 'decimal:2',
        'show_unit_on_documents' => 'boolean',
        'devis_ref_include_year' => 'boolean',
        'devis_ref_reset_yearly' => 'boolean',
        'devis_ref_number_digits' => 'integer',
        'devis_ref_start_number' => 'integer',
        'facture_ref_include_year' => 'boolean',
        'facture_ref_reset_yearly' => 'boolean',
        'facture_ref_number_digits' => 'integer',
        'facture_ref_start_number' => 'integer',
    ];

    public static function current(): self
    {
        $organizationId = Auth::user()->organizationId();

        return static::firstOrCreate(
            ['organization_id' => $organizationId],
            ['organization_id' => $organizationId, 'company_name' => 'My Company']
        );
    }

    public function getLogoFullPathAttribute(): ?string
    {
        return $this->logo_path ? Storage::disk('public')->path($this->logo_path) : null;
    }
}