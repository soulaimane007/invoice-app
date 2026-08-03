<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'page_format' => $this->page_format,
            'name' => $this->name,
            'content' => $this->content,
            'is_default' => (bool) $this->is_default,
            'updated_at' => $this->updated_at,
        ];
    }
}