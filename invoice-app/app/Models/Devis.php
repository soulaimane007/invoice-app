<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Devis extends Model
{
    use HasFactory, SoftDeletes, BelongsToOrganization;

    protected $table = 'devis';

    protected $fillable = [
        'organization_id',
        'user_id',
        'client_id',
        'sous_client_id',
        'reference',
        'date',
        'status',
        'comment',
        'client_name',
        'client_address',
        'client_phone',
        'client_email',
        'client_ice',
        'reference_number',
        'sous_client_name',
        'sous_client_reference',
        'subtotal',
        'tax_total',
        'total',
        'currency',
        'converted_to_facture_id',
    ];

    protected $casts = [
        'date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected $appends = ['is_converted'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function sousClient(): BelongsTo
    {
        return $this->belongsTo(SousClient::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(DevisLigne::class);
    }

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class, 'converted_to_facture_id');
    }

    public function getIsConvertedAttribute(): bool
    {
        return ! is_null($this->converted_to_facture_id);
    }
}