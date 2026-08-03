<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;

class DocumentTemplate extends Model
{
    // Same trait used everywhere else in the app — it auto-scopes every
    // query to the current organization AND automatically rejects (404,
    // not 403) route-model-binding for another organization's template.
    use BelongsToOrganization;

    protected $fillable = ['organization_id', 'document_type', 'page_format', 'name', 'content', 'is_default'];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}