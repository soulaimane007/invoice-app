<?php

namespace App\Http\Requests;

use App\Services\ReferenceGeneratorService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class FactureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
 public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($this->filled('reference_number') && ! $this->user()->hasPermission('can_edit_reference')) {
                $validator->errors()->add('reference_number', "You don't have permission to change the reference number.");
            }
        });
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
'lines.*.quantity' => [
                'nullable', 'numeric', 'min:0.01',
                function ($attribute, $value, $fail) {
                    preg_match('/lines\.(\d+)\.quantity/', $attribute, $matches);
                    $index = $matches[1] ?? null;
                    $isService = $this->input("lines.{$index}.is_service");
                    if (! $isService && $value === null) {
                        $fail('La quantité est obligatoire pour un article.');
                    }
                },
            ],            'lines.*.unit_price' => ['required_with:lines', 'numeric', 'min:0'],
            'lines.*.unit' => ['nullable', 'string', 'max:30'],
            'lines.*.is_service' => ['nullable', 'boolean'],
            'lines.*.tva_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.matricules' => ['nullable', 'array'],
            'lines.*.matricules.*' => ['nullable', 'string', 'max:100'],
        ];
    }
}