<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Off by default — an org must consciously opt a staff member
            // INTO these, rather than accidentally leaving them on.
            $table->boolean('can_edit_after_sent')->default(false)->after('organization_id');
            $table->boolean('can_delete_documents')->default(false)->after('can_edit_after_sent');
            $table->boolean('is_active')->default(true)->after('can_delete_documents');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['can_edit_after_sent', 'can_delete_documents', 'is_active']);
        });
    }
};