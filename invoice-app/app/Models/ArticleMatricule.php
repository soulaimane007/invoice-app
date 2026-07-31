<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleMatricule extends Model
{
    use HasFactory;

    protected $table = 'article_matricules';

    protected $fillable = [
        'article_id', 'matricule', 'facture_ligne_id',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function factureLigne(): BelongsTo
    {
        return $this->belongsTo(FactureLigne::class);
    }

    public function getIsInvoicedAttribute(): bool
    {
        return ! is_null($this->facture_ligne_id);
    }
}