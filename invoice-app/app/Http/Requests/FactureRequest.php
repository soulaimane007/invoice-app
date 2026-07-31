<?php

namespace App\Http\Requests;

use App\Services\ReferenceGeneratorService;
use Illuminate\Foundation\Http\FormRequest;

class FactureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->route('facture') !== null;
        $factureId = $this->route('facture')?->id;

        return [
            'client' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'client.id' => ['nullable', 'integer', 'exists:clients,id'],
            'client.name' => ['required_without:client.id', 'string', 'max:255'],
            'client.address' => ['nullable', 'string', 'max:255'],
            'client.phone' => ['nullable', 'string', 'max:30'],
            'client.email' => ['nullable', 'email', 'max:255'],
            'client.ice' => ['nullable', 'string', 'max:30'],
            'sous_client' => ['nullable', 'array'],
            'sous_client.id' => ['nullable', 'integer', 'exists:sous_clients,id'],
            'sous_client.name' => ['nullable', 'string', 'max:255'],
            'sous_client.reference' => ['nullable', 'string', 'max:100'],

            'reference_number' => [
                'nullable', 'integer', 'min:1',
                function ($attribute, $value, $fail) use ($factureId) {
                    if ($value === null) {
                        return;
                    }
                    $generator = app(ReferenceGeneratorService::class);
                    $reference = $generator->buildFromNumber('facture', (int) $value);
                    if ($generator->exists('facture', $reference, $factureId)) {
                        $fail("La référence \"{$reference}\" est déjà utilisée par une autre facture.");
                    }
                },
            ],
            'date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:date'],
            'payment_status' => ['nullable', 'in:unpaid,partial,paid'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'comment' => ['nullable', 'string'],

            'lines' => [$isUpdate ? 'sometimes' : 'required', 'array', 'min:1'],
            'lines.*.article_id' => ['nullable', 'integer', 'exists:articles,id'],
            'lines.*.description' => ['required_with:lines', 'string'],
            'lines.*.quantity' => ['required_with:lines', 'numeric', 'min:0.01'],
            'lines.*.unit_price' => ['required_with:lines', 'numeric', 'min:0'],
            'lines.*.unit' => ['nullable', 'string', 'max:30'],
            'lines.*.is_service' => ['nullable', 'boolean'],
            'lines.*.tva_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.matricules' => ['nullable', 'array'],
            'lines.*.matricules.*' => ['nullable', 'string', 'max:100'],
        ];
    }
}