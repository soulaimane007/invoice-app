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

    protected $fillable = [
        'name', 'email', 'password', 'role', 'organization_id',
        'can_edit_after_sent', 'can_delete_documents', 'can_edit_reference',
        'can_edit_company_settings', 'can_delete_records', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'can_edit_after_sent' => 'boolean',
        'can_delete_documents' => 'boolean',
        'can_edit_reference' => 'boolean',
        'can_edit_company_settings' => 'boolean',
        'can_delete_records' => 'boolean',
        'is_active' => 'boolean',
    ];

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

    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

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

    /**
     * Organization and developer accounts always have full capability —
     * these flags only ever restrict staff ('user') accounts.
     */
    public function hasPermission(string $permission): bool
    {
        if (in_array($this->role, ['organization', 'developer'], true)) {
            return true;
        }

        return (bool) $this->{$permission};
    }

    /**
     * A staff account is also blocked the instant its parent organization
     * is deactivated, even while its own flag still says active.
     */
    public function isEffectivelyActive(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->role === 'user') {
            return (bool) $this->organization?->is_active;
        }

        return true;
    }
}