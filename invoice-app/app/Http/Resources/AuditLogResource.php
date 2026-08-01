<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization' => $this->whenLoaded('organization', fn () => [
                'id' => $this->organization->id,
                'name' => $this->organization->name,
            ]),
            'actor_name' => $this->actor_name,
            'actor_role' => $this->actor_role,
            'action' => $this->action,
            'subject_type' => $this->subject_type,
            'subject_label' => $this->subject_label,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
        ];
    }
}