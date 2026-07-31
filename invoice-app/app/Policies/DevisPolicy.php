<?php

namespace App\Policies;

use App\Models\Devis;
use App\Models\User;

class DevisPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Devis $devis): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Devis $devis): bool
    {
        // Once a quotation has become an invoice, it's a historical
        // record — further changes belong on the invoice, not here.
        return ! $devis->is_converted;
    }

    public function delete(User $user, Devis $devis): bool
    {
        return ! $devis->is_converted;
    }
}
