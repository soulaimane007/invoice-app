<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureLigneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'article_id' => $this->article_id,
            'article_reference' => $this->whenLoaded('article', fn () => $this->article?->reference),
            'description' => $this->description,
            'quantity' => (float) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'unit' => $this->unit,
            'tva_rate' => (float) $this->tva_rate,
            'total_ht' => (float) $this->total_ht,
            'total_ttc' => (float) $this->total_ttc,
            'sort_order' => $this->sort_order,
            'matricules' => ArticleMatriculeResource::collection($this->whenLoaded('matricules')),
        ];
    }
}