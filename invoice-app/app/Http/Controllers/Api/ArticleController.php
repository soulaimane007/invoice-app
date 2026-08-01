<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ArticleRequest;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Services\ArticleService;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function __construct(private readonly ArticleService $articleService)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Article::class);

        $sortable = ['name', 'unit_price', 'quantity_in_stock', 'created_at'];
        $sortBy = in_array($request->query('sort_by'), $sortable, true) ? $request->query('sort_by') : 'name';
        $sortDir = $request->query('sort_dir') === 'desc' ? 'desc' : 'asc';

        $articles = Article::query()
            ->withSum('factureLignes as quantity_sold_sum', 'quantity')
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->query('search').'%';
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', $term)
                        ->orWhere('reference', 'like', $term)
                        ->orWhere('category', 'like', $term);
                });
            })
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->query('category')))
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereColumn('quantity_in_stock', '<=', 'stock_alert_threshold'))
            ->orderBy($sortBy, $sortDir)
            ->paginate(min($request->integer('per_page', 15), 100));

        return ArticleResource::collection($articles);
    }

    public function stats()
    {
        return response()->json($this->articleService->getStats());
    }
public function history(Request $request, Article $article)
    {
        $this->authorize('view', $article);

        $lines = $article->factureLignes()
            ->with(['facture', 'matricules'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->query('search').'%';
                $q->whereHas('facture', function ($sub) use ($term) {
                    $sub->where('reference', 'like', $term)
                        ->orWhere('client_name', 'like', $term);
                })->orWhereHas('matricules', function ($sub) use ($term) {
                    $sub->where('matricule', 'like', $term);
                });
            })
            ->latest('id')
            ->paginate(min($request->integer('per_page', 10), 50));

        return \App\Http\Resources\ArticleHistoryLigneResource::collection($lines);
    }
    public function autocomplete(Request $request)
    {
        $term = '%'.$request->query('q').'%';

        $articles = Article::query()
            ->where('is_active', true)
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)->orWhere('reference', 'like', $term);
            })
            ->limit(10)
            ->get(['id', 'name', 'reference', 'description', 'unit_price', 'tva_rate', 'quantity_in_stock']);

        return ArticleResource::collection($articles);
    }

    public function store(ArticleRequest $request)
    {
        $this->authorize('create', Article::class);

        $article = Article::create($request->validated());

        return new ArticleResource($article);
    }

    public function show(Article $article)
    {
        $this->authorize('view', $article);

        return new ArticleResource($article);
    }

    public function update(ArticleRequest $request, Article $article)
    {
        $this->authorize('update', $article);

        $article->update($request->validated());

        return new ArticleResource($article);
    }

public function destroy(Request $request, Article $article)
    {
        $this->authorize('delete', $article);

        if (! $request->user()->hasPermission('can_delete_records')) {
            abort(403, "You don't have permission to delete articles.");
        }

        $article->delete();
    }
}