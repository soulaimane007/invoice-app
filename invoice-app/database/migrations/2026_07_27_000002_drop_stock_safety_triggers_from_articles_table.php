<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The business explicitly allows overselling now (invoices are
     * created regardless, with a warning surfaced instead — see
     * ArticleService::decrementStock / FactureService), so the DB-level
     * guard from Phase 1 has to go; it would otherwise reject exactly
     * the negative values this feature intentionally allows.
     */
    public function up(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_articles_prevent_negative_stock_ins');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_articles_prevent_negative_stock_upd');
    }

    public function down(): void
    {
        DB::unprepared('
            CREATE TRIGGER trg_articles_prevent_negative_stock_ins
            BEFORE INSERT ON articles
            FOR EACH ROW
            BEGIN
                IF NEW.quantity_in_stock < 0 THEN
                    SIGNAL SQLSTATE \'45000\'
                    SET MESSAGE_TEXT = \'Stock quantity cannot be negative\';
                END IF;
            END
        ');

        DB::unprepared('
            CREATE TRIGGER trg_articles_prevent_negative_stock_upd
            BEFORE UPDATE ON articles
            FOR EACH ROW
            BEGIN
                IF NEW.quantity_in_stock < 0 THEN
                    SIGNAL SQLSTATE \'45000\'
                    SET MESSAGE_TEXT = \'Stock quantity cannot be negative\';
                END IF;
            END
        ');
    }
};