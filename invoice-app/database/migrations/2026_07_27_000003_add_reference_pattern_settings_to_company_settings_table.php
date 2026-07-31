<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            foreach (['devis', 'facture'] as $type) {
                $defaultPrefix = $type === 'devis' ? 'DEV' : 'FAC';

                $table->string("{$type}_ref_prefix", 20)->nullable()->default($defaultPrefix);
                $table->string("{$type}_ref_separator_1", 5)->nullable()->default('-');
                $table->boolean("{$type}_ref_include_year")->default(true);
                $table->string("{$type}_ref_year_position", 10)->default('middle'); // start | middle | end
                $table->unsignedTinyInteger("{$type}_ref_number_digits")->default(6);
                $table->string("{$type}_ref_separator_2", 5)->nullable()->default('-');
                $table->boolean("{$type}_ref_reset_yearly")->default(true);
                $table->unsignedInteger("{$type}_ref_start_number")->default(1);
            }
        });
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            foreach (['devis', 'facture'] as $type) {
                $table->dropColumn([
                    "{$type}_ref_prefix", "{$type}_ref_separator_1", "{$type}_ref_include_year",
                    "{$type}_ref_year_position", "{$type}_ref_number_digits", "{$type}_ref_separator_2",
                    "{$type}_ref_reset_yearly", "{$type}_ref_start_number",
                ]);
            }
        });
    }
};