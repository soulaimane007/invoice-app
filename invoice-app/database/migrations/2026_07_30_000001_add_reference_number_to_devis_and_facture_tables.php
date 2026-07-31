<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->unsignedInteger('reference_number')->nullable()->after('reference');
        });

        Schema::table('facture', function (Blueprint $table) {
            $table->unsignedInteger('reference_number')->nullable()->after('reference');
        });

        // Best-effort backfill for documents created before this column
        // existed: pull the trailing digits off the current reference.
        foreach (['devis', 'facture'] as $table) {
            DB::table($table)->orderBy('id')->chunkById(200, function ($rows) use ($table) {
                foreach ($rows as $row) {
                    if (preg_match('/(\d+)$/', $row->reference, $matches)) {
                        DB::table($table)->where('id', $row->id)->update(['reference_number' => (int) $matches[1]]);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropColumn('reference_number');
        });
        Schema::table('facture', function (Blueprint $table) {
            $table->dropColumn('reference_number');
        });
    }
};