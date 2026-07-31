<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'ice' => $this->ice,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'notes' => $this->notes,
            'devis_count' => $this->whenCounted('devis'),
            'factures_count' => $this->whenCounted('factures'),
            'total_billed' => $this->when(isset($this->total_billed), fn () => (float) $this->total_billed),
            // Simple proxy for now (the client record's own last edit). A
            // true "last touched by any invoice/quote" figure would need
            // a small cross-table query — easy to add later if wanted.
            'last_activity' => $this->updated_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
