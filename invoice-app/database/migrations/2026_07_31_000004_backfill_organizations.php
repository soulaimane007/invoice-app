<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    private array $tables = ['clients', 'articles', 'devis', 'facture', 'company_settings', 'reference_counters'];

    public function up(): void
    {
        $rootOrganizationId = DB::table('users')->orderBy('id')->value('id');

        if ($rootOrganizationId) {
            // The very first account becomes the one existing organization —
            // everything already created attaches to it, so nothing you've
            // already entered disappears.
            DB::table('users')->where('id', $rootOrganizationId)->update([
                'role' => 'organization',
                'organization_id' => null,
            ]);

            // Any OTHER pre-existing accounts become staff of that same
            // organization rather than being removed.
            DB::table('users')->where('id', '!=', $rootOrganizationId)->update([
                'role' => 'user',
                'organization_id' => $rootOrganizationId,
            ]);

            foreach ($this->tables as $table) {
                DB::table($table)->update(['organization_id' => $rootOrganizationId]);
            }
        }

        // Bootstrap developer account — this is the ONLY way to create the
        // first organization once this migration has run, since public
        // registration no longer exists. Log in with this once, then change
        // the password from Profile immediately.
        if (! DB::table('users')->where('role', 'developer')->exists()) {
            DB::table('users')->insert([
                'name' => 'Developer',
                'email' => 'developer@invoiceapp.local',
                'password' => Hash::make('ChangeMe123!'),
                'role' => 'developer',
                'organization_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ($this->tables as $table) {
            DB::statement("ALTER TABLE {$table} MODIFY organization_id BIGINT UNSIGNED NOT NULL");
        }

        DB::statement('ALTER TABLE company_settings ADD UNIQUE (organization_id)');
        DB::statement('ALTER TABLE reference_counters DROP INDEX reference_counters_document_type_year_unique');
        DB::statement('ALTER TABLE reference_counters ADD UNIQUE (organization_id, document_type, year)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE reference_counters DROP INDEX reference_counters_organization_id_document_type_year_unique');
        DB::statement('ALTER TABLE reference_counters ADD UNIQUE (document_type, year)');
        DB::statement('ALTER TABLE company_settings DROP INDEX company_settings_organization_id_unique');

        foreach ($this->tables as $table) {
            DB::statement("ALTER TABLE {$table} MODIFY organization_id BIGINT UNSIGNED NULL");
        }

        DB::table('users')->where('email', 'developer@invoiceapp.local')->delete();
    }
};