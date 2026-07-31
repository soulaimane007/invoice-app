<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ArticleService
{
    public function getStats(): array
    {
        // GREATEST(quantity_in_stock, 0) floors each article's own
        // contribution at 0 before it's summed — an oversold item still
        // shows its true negative number on its own row, it just can't
        // pull the aggregate below what's actually usable.
        // Routed through the Article relationship (not a raw facture_lignes
        // table query) specifically so it inherits organization scoping and
        // soft-delete exclusion the same way every other line here does —
        // a bare DB::table() call bypasses both.
        $totalSold = (float) (Article::query()
            ->join('facture_lignes', 'facture_lignes.article_id', '=', 'articles.id')
            ->selectRaw('COALESCE(SUM(facture_lignes.quantity), 0) as total')
            ->value('total') ?? 0);

        return [
            'total_articles' => Article::count(),
            'total_stock' => (int) (Article::selectRaw('COALESCE(SUM(GREATEST(quantity_in_stock, 0)), 0) as total')->value('total') ?? 0),
            'stock_value' => (float) (Article::selectRaw('COALESCE(SUM(GREATEST(quantity_in_stock, 0) * unit_price), 0) as value')->value('value') ?? 0),
            'total_sold' => $totalSold,
            'low_stock_count' => Article::whereColumn('quantity_in_stock', '<=', 'stock_alert_threshold')->count(),
        ];
    }

    public function decrementStock(Article $article, float $quantity): bool
    {
        $sufficient = $article->quantity_in_stock >= $quantity;
        $article->decrement('quantity_in_stock', $quantity);

        return $sufficient;
    }

    public function restoreStock(Article $article, float $quantity): void
    {
        $article->increment('quantity_in_stock', $quantity);
    }

    public function findOrCreate(string $description, float $unitPrice, float $tvaRate, ?string $unit = null): Article
    {
        $name = trim($description);

        $existing = Article::whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();
        if ($existing) {
            return $existing;
        }

        return Article::create([
            'name' => $name,
            'reference' => $this->generateAutoReference(),
            'unit' => $unit ?: 'Unité',
            'unit_price' => $unitPrice,
            'tva_rate' => $tvaRate,
            'quantity_in_stock' => 0,
            'stock_alert_threshold' => 5,
            'is_active' => true,
        ]);
    }

    private function generateAutoReference(): string
    {
        do {
            $reference = 'AUTO-'.strtoupper(Str::random(8));
        } while (Article::withTrashed()->where('reference', $reference)->exists());

        return $reference;
    }
}