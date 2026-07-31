<?php

namespace App\Providers;

use App\Models\Facture;
use App\Observers\FactureObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Facture::observe(FactureObserver::class);
    }
}