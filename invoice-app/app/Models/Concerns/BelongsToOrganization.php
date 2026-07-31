<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Automatically confines every query on this model to the current
 * user's organization, and stamps organization_id on new records. This
 * is the entire isolation mechanism between tenants — it happens at
 * the query level so no individual controller has to remember to add
 * it, which is the difference between "usually scoped" and "always
 * scoped."
 */
trait BelongsToOrganization
{
    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder) {
            if (Auth::check()) {
                $organizationId = Auth::user()->organizationId();
                if ($organizationId) {
                    $builder->where($builder->getModel()->getTable().'.organization_id', $organizationId);
                }
            }
        });

        static::creating(function ($model) {
            if (! $model->organization_id && Auth::check()) {
                $model->organization_id = Auth::user()->organizationId();
            }
        });
    }
}