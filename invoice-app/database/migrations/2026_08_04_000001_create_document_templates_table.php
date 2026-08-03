<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('users')->cascadeOnDelete();
            $table->string('document_type', 10); // 'devis' | 'facture'
            $table->string('name');
            $table->longText('content');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['organization_id', 'document_type', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};