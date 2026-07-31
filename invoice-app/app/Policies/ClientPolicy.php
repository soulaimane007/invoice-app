<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

// Intentionally permissive for now — no role system was requested, so
// every authenticated user can manage clients. The methods are here and
// wired into the controllers so adding roles later is a one-file change,
// not a re-plumbing of every endpoint.
class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Client $client): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Client $client): bool
    {
        return true;
    }

    public function delete(User $user, Client $client): bool
    {
        return true;
    }
}
