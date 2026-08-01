<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanySettingResource;
use App\Models\CompanySetting;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanySettingController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    public function show()
    {
        return new CompanySettingResource(CompanySetting::current());
    }

    public function update(Request $request)
    {
        if (! $request->user()->hasPermission('can_edit_company_settings')) {
            abort(403, "You don't have permission to change company settings.");
        }

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'ice' => ['nullable', 'string', 'max:30'],
            'default_currency' => ['nullable', 'string', 'size:3'],
            'default_tva_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'show_unit_on_documents' => ['nullable', 'boolean'],
            'invoice_footer_note' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:2048'],

            'devis_ref_prefix' => ['nullable', 'string', 'max:20'],
            'devis_ref_separator_1' => ['nullable', 'string', 'max:5'],
            'devis_ref_include_year' => ['nullable', 'boolean'],
            'devis_ref_year_position' => ['nullable', 'in:start,middle,end'],
            'devis_ref_number_digits' => ['required', 'integer', 'min:1', 'max:10'],
            'devis_ref_separator_2' => ['nullable', 'string', 'max:5'],
            'devis_ref_reset_yearly' => ['nullable', 'boolean'],
            'devis_ref_start_number' => ['required', 'integer', 'min:1'],

            'facture_ref_prefix' => ['nullable', 'string', 'max:20'],
            'facture_ref_separator_1' => ['nullable', 'string', 'max:5'],
            'facture_ref_include_year' => ['nullable', 'boolean'],
            'facture_ref_year_position' => ['nullable', 'in:start,middle,end'],
            'facture_ref_number_digits' => ['required', 'integer', 'min:1', 'max:10'],
            'facture_ref_separator_2' => ['nullable', 'string', 'max:5'],
            'facture_ref_reset_yearly' => ['nullable', 'boolean'],
            'facture_ref_start_number' => ['required', 'integer', 'min:1'],
        ]);

        $settings = CompanySetting::current();

        if ($request->hasFile('logo')) {
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        unset($validated['logo']);
        $settings->update($validated);

        $this->auditLog->log($request->user()->organizationId(), 'company_settings.updated', $settings, $settings->company_name);

        return new CompanySettingResource($settings->fresh());
    }
}