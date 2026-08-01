<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    // Reused deliberately: for an Organization, this trait's read-side
    // global scope auto-restricts every query to their own org_id. For a
    // Developer, organizationId() is null, so the trait applies no
    // restriction at all — they see everything. Same trait, two correct
    // behaviors, with zero manual role-branching needed in the controller.
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id', 'actor_id', 'actor_name', 'actor_role',
        'action', 'subject_type', 'subject_id', 'subject_label', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organization_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}