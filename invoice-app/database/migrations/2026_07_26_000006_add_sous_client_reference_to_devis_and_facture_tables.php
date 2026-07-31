<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->string('sous_client_reference')->nullable()->after('sous_client_name');
        });

        Schema::table('facture', function (Blueprint $table) {
            $table->string('sous_client_reference')->nullable()->after('sous_client_name');
        });
    }

    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropColumn('sous_client_reference');
        });

        Schema::table('facture', function (Blueprint $table) {
            $table->dropColumn('sous_client_reference');
        });
    }
};