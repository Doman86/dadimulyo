<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('truck_categories')->nullOnDelete();
            $table->foreignId('seller_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('brand');
            $table->string('model');
            $table->smallInteger('year')->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('mileage', 12, 2)->nullable();
            $table->string('engine')->nullable();
            $table->string('transmission')->nullable();
            $table->string('fuel_type')->nullable();
            $table->string('capacity')->nullable();
            $table->string('condition')->default('used');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->default('available');
            $table->boolean('is_for_sale')->default(true);
            $table->boolean('is_for_rent')->default(false);
            $table->timestamps();

            $table->index(['brand', 'status']);
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
