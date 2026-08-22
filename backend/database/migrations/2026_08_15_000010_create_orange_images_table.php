<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orange_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orange_product_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('orange_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orange_images');
    }
};
