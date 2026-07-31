<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'organization_id'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * The tenant this account operates under: itself, if this IS an
     * organization account; its parent, if this is staff. Null for
     * developer accounts, which don't belong to any tenant.
     */
    public function organizationId(): ?int
    {
        return $this->role === 'organization' ? $this->id : $this->organization_id;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organization_id');
    }

    public function staff(): HasMany
    {
        return $this->hasMany(User::class, 'organization_id');
    }

    // Documents this specific staff member personally created — unchanged
    // from before, distinct from "everything the organization owns" below.
    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    // Used by the developer's organizations list to show usage counts.
    public function organizationClients(): HasMany
    {
        return $this->hasMany(Client::class, 'organization_id');
    }

    public function organizationDevis(): HasMany
    {
        return $this->hasMany(Devis::class, 'organization_id');
    }

    public function organizationFactures(): HasMany
    {
        return $this->hasMany(Facture::class, 'organization_id');
    }
}