<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class OrganizationController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    public function index(Request $request)
    {
        $organizations = User::where('role', 'organization')
            ->withCount(['organizationClients', 'organizationDevis', 'organizationFactures'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->query('search').'%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->latest()
            ->paginate(min($request->integer('per_page', 10), 100));

        return OrganizationResource::collection($organizations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $organization = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'organization',
            'organization_id' => null,
        ]);

        $this->auditLog->log($organization->id, 'organization.created', $organization, $organization->name);

        return new OrganizationResource($organization);
    }

    public function resetPassword(Request $request, User $organization)
    {
        abort_unless($organization->role === 'organization', 404);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $organization->update(['password' => Hash::make($validated['password'])]);

        $this->auditLog->log($organization->id, 'organization.password_reset', $organization, $organization->name);

        return response()->json(['message' => 'Password reset.']);
    }

    public function toggleActive(User $organization)
    {
        abort_unless($organization->role === 'organization', 404);

        $organization->update(['is_active' => ! $organization->is_active]);

        $this->auditLog->log(
            $organization->id,
            $organization->is_active ? 'organization.activated' : 'organization.deactivated',
            $organization,
            $organization->name
        );

        return new OrganizationResource($organization);
    }
}