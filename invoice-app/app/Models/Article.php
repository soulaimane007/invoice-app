<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Article extends Model
{
    use HasFactory, SoftDeletes, BelongsToOrganization;

    protected $table = 'articles';

    protected $fillable = [
        'organization_id', 'name', 'reference', 'description', 'category', 'unit',
        'unit_price', 'tva_rate', 'quantity_in_stock', 'stock_alert_threshold', 'is_active',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'tva_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = ['is_low_stock'];

    public function devisLignes(): HasMany
    {
        return $this->hasMany(DevisLigne::class);
    }

    public function factureLignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }

    public function matricules(): HasMany
    {
        return $this->hasMany(ArticleMatricule::class);
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->quantity_in_stock <= $this->stock_alert_threshold;
    }

    public function getQuantitySoldAttribute(): float
    {
        return (float) $this->factureLignes()->sum('quantity');
    }
}