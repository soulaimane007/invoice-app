<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Defense-in-depth safety net: the app decrements stock through
     * ArticleService (Phase 2), but this trigger guarantees the database
     * itself never accepts a negative quantity even if that path is
     * bypassed.
     */
    public function up(): void
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

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_articles_prevent_negative_stock_ins');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_articles_prevent_negative_stock_upd');
    }
};
