<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devis_lignes', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->nullable()->change();
        });
        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('devis_lignes', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->nullable(false)->change();
        });
        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->nullable(false)->change();
        });
    }
};