<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_matricules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->string('matricule');
            $table->foreignId('facture_ligne_id')->nullable()->constrained('facture_lignes')->nullOnDelete();
            $table->timestamps();

            $table->unique('matricule');
            $table->index(['article_id', 'facture_ligne_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_matricules');
    }
};