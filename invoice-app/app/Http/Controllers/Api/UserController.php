<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    public function index(Request $request)
    {
        $users = User::where('organization_id', $request->user()->organizationId())
            ->where('role', 'user')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->query('search').'%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->latest()
            ->paginate(min($request->integer('per_page', 10), 100));

        return UserResource::collection($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'can_edit_after_sent' => ['nullable', 'boolean'],
            'can_delete_documents' => ['nullable', 'boolean'],
            'can_edit_reference' => ['nullable', 'boolean'],
            'can_edit_company_settings' => ['nullable', 'boolean'],
            'can_delete_records' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'organization_id' => $request->user()->organizationId(),
            'can_edit_after_sent' => $validated['can_edit_after_sent'] ?? false,
            'can_delete_documents' => $validated['can_delete_documents'] ?? false,
            'can_edit_reference' => $validated['can_edit_reference'] ?? false,
            'can_edit_company_settings' => $validated['can_edit_company_settings'] ?? false,
            'can_delete_records' => $validated['can_delete_records'] ?? false,
        ]);

        $this->auditLog->log($request->user()->organizationId(), 'user.created', $user, $user->name, [
            'can_edit_after_sent' => $user->can_edit_after_sent,
            'can_delete_documents' => $user->can_delete_documents,
            'can_edit_reference' => $user->can_edit_reference,
            'can_edit_company_settings' => $user->can_edit_company_settings,
            'can_delete_records' => $user->can_delete_records,
        ]);

        return new UserResource($user);
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeOwnStaff($request, $user);

        $validated = $request->validate([
            'can_edit_after_sent' => ['required', 'boolean'],
            'can_delete_documents' => ['required', 'boolean'],
            'can_edit_reference' => ['required', 'boolean'],
            'can_edit_company_settings' => ['required', 'boolean'],
            'can_delete_records' => ['required', 'boolean'],
        ]);

        $user->update($validated);

        $this->auditLog->log($request->user()->organizationId(), 'user.permissions_updated', $user, $user->name, $validated);

        return new UserResource($user);
    }

    public function resetPassword(Request $request, User $user)
    {
        $this->authorizeOwnStaff($request, $user);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user->update(['password' => Hash::make($validated['password'])]);

        $this->auditLog->log($request->user()->organizationId(), 'user.password_reset', $user, $user->name);

        return response()->json(['message' => 'Password reset.']);
    }

    public function toggleActive(Request $request, User $user)
    {
        $this->authorizeOwnStaff($request, $user);

        $user->update(['is_active' => ! $user->is_active]);

        $this->auditLog->log(
            $request->user()->organizationId(),
            $user->is_active ? 'user.activated' : 'user.deactivated',
            $user,
            $user->name
        );

        return new UserResource($user);
    }

    private function authorizeOwnStaff(Request $request, User $user): void
    {
        abort_unless(
            $user->role === 'user' && $user->organization_id === $request->user()->organizationId(),
            404
        );
    }
}