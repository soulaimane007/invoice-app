<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devis_lignes', function (Blueprint $table) {
            $table->boolean('is_service')->default(false)->after('unit');
        });

        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->boolean('is_service')->default(false)->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('devis_lignes', fn (Blueprint $table) => $table->dropColumn('is_service'));
        Schema::table('facture_lignes', fn (Blueprint $table) => $table->dropColumn('is_service'));
    }
};