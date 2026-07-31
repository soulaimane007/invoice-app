<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('client_id')->constrained('clients')->restrictOnDelete();

            $table->string('reference')->unique();
            $table->date('date');
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
            $table->text('comment')->nullable();

            // Snapshot of client details at time of issue, so the document
            // stays accurate even if the client record changes later.
            $table->string('client_name')->nullable();
            $table->string('client_address')->nullable();
            $table->string('client_phone', 30)->nullable();
            $table->string('client_email')->nullable();
            $table->string('client_ice', 30)->nullable();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('tax_total', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->char('currency', 3)->default('MAD');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis');
    }
};
