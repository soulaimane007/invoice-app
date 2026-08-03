<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DocumentTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $templateId = $this->route('document_template')?->id;

        return [
            'document_type' => ['required', 'in:devis,facture'],
            'page_format' => ['nullable', 'in:A4,Letter,Legal'],
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('document_templates', 'name')
                    ->where('organization_id', Auth::user()->organizationId())
                    ->where('document_type', $this->input('document_type'))
                    ->ignore($templateId),
            ],
            'content' => ['required', 'string'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}