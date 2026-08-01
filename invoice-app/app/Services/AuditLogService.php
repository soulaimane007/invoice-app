<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    public function log(int $organizationId, string $action, ?Model $subject = null, ?string $subjectLabel = null, array $metadata = []): void
    {
        $actor = Auth::user();

        AuditLog::create([
            'organization_id' => $organizationId,
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
            'actor_role' => $actor?->role,
            'action' => $action,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id' => $subject?->id,
            'subject_label' => $subjectLabel,
            'metadata' => $metadata ?: null,
        ]);
    }
}