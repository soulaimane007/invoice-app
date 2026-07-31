<?php

namespace App\Policies;

use App\Models\Facture;
use App\Models\User;

class FacturePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Facture $facture): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Facture $facture): bool
    {
        return true;
    }

    public function delete(User $user, Facture $facture): bool
    {
        return true;
    }
}
