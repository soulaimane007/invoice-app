<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Existing 'expired' quotations become 'rejected' — closest
        // equivalent outcome — before the enum value is removed.
        DB::table('devis')->where('status', 'expired')->update(['status' => 'rejected']);

        DB::statement("ALTER TABLE devis MODIFY status ENUM('draft','sent','accepted','rejected') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE devis MODIFY status ENUM('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft'");
    }
};