<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleMatriculeResource;
use App\Models\Article;
use App\Models\ArticleMatricule;
use Illuminate\Http\Request;

class ArticleMatriculeController extends Controller
{
    public function index(Article $article)
    {
        $this->authorize('view', $article);

        $matricules = $article->matricules()
            ->with('factureLigne.facture')
            ->orderByDesc('id')
            ->get();

        return ArticleMatriculeResource::collection($matricules);
    }

    public function autocomplete(Request $request, Article $article)
    {
        $term = '%'.$request->query('q', '').'%';

        $matricules = $article->matricules()
            ->whereNull('facture_ligne_id')
            ->where('matricule', 'like', $term)
            ->orderBy('matricule')
            ->limit(10)
            ->get(['id', 'matricule']);

        return ArticleMatriculeResource::collection($matricules);
    }

    public function store(Request $request, Article $article)
    {
        $this->authorize('update', $article);

        $validated = $request->validate([
            'matricule' => ['required', 'string', 'max:100', 'unique:article_matricules,matricule'],
        ]);

        $matricule = $article->matricules()->create($validated);

        return new ArticleMatriculeResource($matricule);
    }

    public function destroy(ArticleMatricule $articleMatricule)
    {
        $this->authorize('update', $articleMatricule->article);

        if ($articleMatricule->is_invoiced) {
            return response()->json(['message' => 'This matricule is already on an invoice and cannot be deleted.'], 422);
        }

        $articleMatricule->delete();

        return response()->json(['message' => 'Matricule deleted.']);
    }
}