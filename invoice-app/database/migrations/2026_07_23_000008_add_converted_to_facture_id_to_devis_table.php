<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->foreignId('converted_to_facture_id')
                ->nullable()
                ->after('status')
                ->constrained('facture')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropForeign(['converted_to_facture_id']);
            $table->dropColumn('converted_to_facture_id');
        });
    }
};
