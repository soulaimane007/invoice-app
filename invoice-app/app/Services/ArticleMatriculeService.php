<?php

namespace App\Services;

use App\Models\ArticleMatricule;
use App\Models\FactureLigne;
use RuntimeException;

class ArticleMatriculeService
{
    /**
     * Given raw matricule strings typed in for one facture line, resolve
     * each one to an ArticleMatricule row — reusing an existing
     * not-yet-invoiced one if the text matches, creating a fresh one
     * otherwise — and mark it consumed by this line. Blank entries are
     * skipped; matricules are optional per unit.
     */
    public function attachToLine(FactureLigne $line, int $articleId, array $matricules): void
    {
        foreach ($matricules as $value) {
            $value = trim((string) $value);
            if ($value === '') {
                continue;
            }

            $existing = ArticleMatricule::where('article_id', $articleId)
                ->where('matricule', $value)
                ->whereNull('facture_ligne_id')
                ->first();

            if ($existing) {
                $existing->update(['facture_ligne_id' => $line->id]);
                continue;
            }

            // Matricules are globally unique — if this text exists but is
            // already invoiced elsewhere, don't silently steal it.
            if (ArticleMatricule::where('matricule', $value)->exists()) {
                throw new RuntimeException("Le matricule \"{$value}\" est déjà utilisé sur une autre facture.");
            }

            ArticleMatricule::create([
                'article_id' => $articleId,
                'matricule' => $value,
                'facture_ligne_id' => $line->id,
            ]);
        }
    }

    /**
     * Frees up any matricules tied to a line before it's deleted or
     * replaced — mirrors stock restoration. They become available again
     * rather than being deleted outright.
     */
    public function releaseFromLine(FactureLigne $line): void
    {
        ArticleMatricule::where('facture_ligne_id', $line->id)->update(['facture_ligne_id' => null]);
    }
}