<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'reference' => $this->reference,
            'description' => $this->description,
            'category' => $this->category,
            'unit_price' => (float) $this->unit_price,
            'tva_rate' => (float) $this->tva_rate,
            'quantity_in_stock' => $this->quantity_in_stock,
            'quantity_sold' => (float) ($this->quantity_sold_sum ?? $this->quantity_sold),
            'stock_alert_threshold' => $this->stock_alert_threshold,
            'is_low_stock' => $this->is_low_stock,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}