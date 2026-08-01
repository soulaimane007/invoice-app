<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('organization:id,name')->latest();

        if ($request->user()->role === 'developer' && $request->filled('organization_id')) {
            $query->where('organization_id', $request->query('organization_id'));
        }

        if ($request->filled('search')) {
            $term = '%'.$request->query('search').'%';
            $query->where(fn ($q) => $q->where('actor_name', 'like', $term)->orWhere('subject_label', 'like', $term));
        }

        $logs = $query->paginate(min($request->integer('per_page', 15), 100));

        return AuditLogResource::collection($logs);
    }
}