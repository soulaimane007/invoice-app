<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reference_counters', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 20); // 'devis' | 'facture'
            // 0 = no yearly reset (one counter forever); otherwise the actual year.
            // Using 0 rather than NULL here on purpose — MySQL's unique index
            // treats every NULL as distinct, which would silently defeat this
            // constraint for the "never resets" case.
            $table->unsignedSmallInteger('year')->default(0);
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();

            $table->unique(['document_type', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reference_counters');
    }
};