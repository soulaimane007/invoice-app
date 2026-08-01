<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'can_edit_after_sent' => (bool) $this->can_edit_after_sent,
            'can_delete_documents' => (bool) $this->can_delete_documents,
            'can_edit_reference' => (bool) $this->can_edit_reference,
            'can_edit_company_settings' => (bool) $this->can_edit_company_settings,
            'can_delete_records' => (bool) $this->can_delete_records,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at,
        ];
    }
}