<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('reference')->unique();
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('tva_rate', 5, 2)->default(20.00);
            $table->integer('quantity_in_stock')->default(0);
            $table->integer('stock_alert_threshold')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
