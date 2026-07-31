<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'reference_number' => $this->reference_number,
            'date' => $this->date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'payment_status' => $this->payment_status,
            'amount_paid' => (float) $this->amount_paid,
            'remaining_balance' => (float) $this->remaining_balance,
            'is_overdue' => $this->is_overdue,
            'comment' => $this->comment,
            'client' => [
                'id' => $this->client_id,
                'name' => $this->client_name,
                'address' => $this->client_address,
                'phone' => $this->client_phone,
                'email' => $this->client_email,
                'ice' => $this->client_ice,
            ],
          'sous_client' => $this->sous_client_id ? [
                'id' => $this->sous_client_id,
                'name' => $this->sous_client_name,
                'reference' => $this->sous_client_reference,
            ] : null,
            'devis_id' => $this->devis_id,
            'subtotal' => (float) $this->subtotal,
            'tax_total' => (float) $this->tax_total,
            'total' => (float) $this->total,
            'currency' => $this->currency,
            'lines' => FactureLigneResource::collection($this->whenLoaded('lignes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}