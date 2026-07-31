<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('unit', 30)->default('Unité')->after('category');
        });

        Schema::table('devis_lignes', function (Blueprint $table) {
            $table->string('unit', 30)->default('Unité')->after('description');
            $table->dropColumn('discount_percent');
        });

        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->string('unit', 30)->default('Unité')->after('description');
            $table->dropColumn('discount_percent');
        });

        Schema::table('devis', function (Blueprint $table) {
            $table->dropColumn('discount_total');
        });

        Schema::table('facture', function (Blueprint $table) {
            $table->dropColumn('discount_total');
        });

        Schema::table('company_settings', function (Blueprint $table) {
            $table->boolean('show_unit_on_documents')->default(false)->after('default_tva_rate');
        });
    }

    public function down(): void
    {
        Schema::table('articles', fn (Blueprint $t) => $t->dropColumn('unit'));

        Schema::table('devis_lignes', function (Blueprint $t) {
            $t->decimal('discount_percent', 5, 2)->default(0)->after('unit_price');
            $t->dropColumn('unit');
        });

        Schema::table('facture_lignes', function (Blueprint $t) {
            $t->decimal('discount_percent', 5, 2)->default(0)->after('unit_price');
            $t->dropColumn('unit');
        });

        Schema::table('devis', fn (Blueprint $t) => $t->decimal('discount_total', 12, 2)->default(0)->after('subtotal'));
        Schema::table('facture', fn (Blueprint $t) => $t->decimal('discount_total', 12, 2)->default(0)->after('subtotal'));
        Schema::table('company_settings', fn (Blueprint $t) => $t->dropColumn('show_unit_on_documents'));
    }
};