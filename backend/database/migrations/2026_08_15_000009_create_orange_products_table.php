<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orange_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('orange_categories')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('grade')->nullable();
            $table->decimal('price_per_kg', 15, 2)->default(0);
            $table->decimal('wholesale_price', 15, 2)->nullable();
            $table->decimal('stock_kg', 12, 2)->default(0);
            $table->decimal('minimum_order_kg', 12, 2)->default(1);
            $table->date('harvest_date')->nullable();
            $table->string('farm_location')->nullable();
            $table->string('status')->default('available');
            $table->timestamps();

            $table->index(['status', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orange_products');
    }
};
