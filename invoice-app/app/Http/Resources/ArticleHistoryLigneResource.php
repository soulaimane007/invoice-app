<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleHistoryLigneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quantity' => (float) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'total_ttc' => (float) $this->total_ttc,
            'matricules' => $this->matricules->pluck('matricule'),
            'facture' => [
                'id' => $this->facture->id,
                'reference' => $this->facture->reference,
                'date' => $this->facture->date?->toDateString(),
                'client_name' => $this->facture->client_name,
                'payment_status' => $this->facture->payment_status,
            ],
        ];
    }
}