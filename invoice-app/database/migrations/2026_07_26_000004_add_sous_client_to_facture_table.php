<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facture', function (Blueprint $table) {
            $table->foreignId('sous_client_id')->nullable()->after('client_id')->constrained('sous_clients')->nullOnDelete();
            $table->string('sous_client_name')->nullable()->after('client_ice');
        });
    }

    public function down(): void
    {
        Schema::table('facture', function (Blueprint $table) {
            $table->dropForeign(['sous_client_id']);
            $table->dropColumn(['sous_client_id', 'sous_client_name']);
        });
    }
};