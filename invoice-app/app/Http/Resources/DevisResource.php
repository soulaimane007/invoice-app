<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'reference_number' => $this->reference_number,
            'date' => $this->date?->toDateString(),
            'status' => $this->status,
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
            'subtotal' => (float) $this->subtotal,
            'tax_total' => (float) $this->tax_total,
            'total' => (float) $this->total,
            'currency' => $this->currency,
            'is_converted' => $this->is_converted,
            'converted_to_facture_id' => $this->converted_to_facture_id,
            'lines' => DevisLigneResource::collection($this->whenLoaded('lignes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}