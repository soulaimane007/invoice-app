<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleMatriculeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'matricule' => $this->matricule,
            'is_invoiced' => $this->is_invoiced,
            'facture_reference' => $this->whenLoaded('factureLigne', fn () => $this->factureLigne?->facture?->reference),
            'created_at' => $this->created_at,
        ];
    }
}