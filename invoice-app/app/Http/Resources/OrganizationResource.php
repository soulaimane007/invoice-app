<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'clients_count' => $this->whenCounted('organizationClients'),
            'devis_count' => $this->whenCounted('organizationDevis'),
            'factures_count' => $this->whenCounted('organizationFactures'),
            'created_at' => $this->created_at,
        ];
    }
}