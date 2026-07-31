<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $articleId = $this->route('article')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'reference' => ['required', 'string', 'max:100', Rule::unique('articles', 'reference')->ignore($articleId)],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:30'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'tva_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'quantity_in_stock' => ['required', 'integer', 'min:0'],
            'stock_alert_threshold' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
