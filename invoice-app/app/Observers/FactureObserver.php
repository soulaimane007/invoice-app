<?php

namespace App\Observers;

use App\Models\Facture;

class FactureObserver
{
    public function saving(Facture $facture): void
    {
        if ($facture->isDirty('payment_status')) {
            if ($facture->payment_status === 'paid' && ! $facture->paid_at) {
                $facture->paid_at = now();
            } elseif ($facture->payment_status !== 'paid') {
                $facture->paid_at = null;
            }
        }
    }
}