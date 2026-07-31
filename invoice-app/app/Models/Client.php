<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes, BelongsToOrganization;

    protected $table = 'clients';

    protected $fillable = [
        'organization_id', 'name', 'ice', 'address', 'phone', 'email', 'notes',
    ];
    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    public function sousClients(): HasMany
    {
        return $this->hasMany(SousClient::class);
    }

    public function scopeWithStats($query)
    {
        return $query
            ->withCount(['devis', 'factures'])
            ->withSum('factures as total_billed', 'total');
    }
}