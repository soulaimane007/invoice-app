<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_edit_reference')->default(false)->after('can_delete_documents');
            $table->boolean('can_edit_company_settings')->default(false)->after('can_edit_reference');
            $table->boolean('can_delete_records')->default(false)->after('can_edit_company_settings');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['can_edit_reference', 'can_edit_company_settings', 'can_delete_records']);
        });
    }
};