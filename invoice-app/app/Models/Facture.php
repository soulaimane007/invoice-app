<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Facture extends Model
{
    use HasFactory, SoftDeletes, BelongsToOrganization;

    protected $table = 'facture';

    protected $fillable = [
        'organization_id',
        'user_id',
        'client_id',
        'sous_client_id',
        'devis_id',
        'reference',
        'date',
        'due_date',
        'payment_status',
        'amount_paid',
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
    ];
    // paid_at is intentionally NOT fillable — it's only ever set by
    // FactureObserver, never directly from user input.

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'amount_paid' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected $appends = ['is_overdue', 'remaining_balance'];

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

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }

    public function getRemainingBalanceAttribute(): string
    {
        return bcsub((string) $this->total, (string) $this->amount_paid, 2);
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->payment_status !== 'paid'
            && $this->due_date !== null
            && $this->due_date->isPast();
    }
}