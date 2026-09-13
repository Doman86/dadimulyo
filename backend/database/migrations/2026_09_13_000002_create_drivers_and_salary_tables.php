<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('license_number')->nullable();
            $table->string('license_class')->nullable(); // A, B1, B2, C
            $table->text('address')->nullable();
            $table->string('profile_image')->nullable();
            $table->string('status')->default('active'); // active, inactive, suspended
            $table->string('driver_type')->default('tetap'); // tetap, lepas
            $table->decimal('base_salary', 15, 2)->nullable(); // gaji pokok/bulan (driver tetap)
            $table->decimal('commission_rate', 5, 2)->nullable(); // % komisi sewa
            $table->decimal('delivery_commission', 15, 2)->nullable(); // komisi per pengiriman
            $table->decimal('rental_commission', 15, 2)->nullable(); // komisi per rental
            $table->unsignedInteger('monthly_target')->nullable(); // target rental/bulan
            $table->decimal('bonus_target_amount', 15, 2)->nullable();
            $table->decimal('bonus_rating_amount', 15, 2)->nullable();
            $table->decimal('late_deduction', 15, 2)->nullable();
            $table->decimal('complaint_deduction', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('driver_type');
        });

        Schema::create('driver_salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('drivers')->cascadeOnDelete();
            $table->foreignId('rental_id')->nullable()->constrained('rentals')->nullOnDelete();
            $table->decimal('base_salary', 15, 2)->default(0);
            $table->decimal('rental_commission', 15, 2)->default(0);
            $table->decimal('delivery_commission', 15, 2)->default(0);
            $table->decimal('bonus', 15, 2)->default(0);
            $table->decimal('bonus_target', 15, 2)->default(0);
            $table->decimal('bonus_rating', 15, 2)->default(0);
            $table->decimal('deduction', 15, 2)->default(0);
            $table->decimal('late_deduction', 15, 2)->default(0);
            $table->decimal('complaint_deduction', 15, 2)->default(0);
            $table->decimal('net_salary', 15, 2)->default(0);
            $table->string('period', 7); // format "2026-09"
            $table->unsignedInteger('rental_count')->default(0);
            $table->unsignedInteger('delivery_count')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->string('status')->default('pending'); // pending, paid, cancelled
            $table->string('payment_method')->nullable(); // cash, transfer, ewallet
            $table->timestamp('payment_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['driver_id', 'period']);
            $table->index('status');
        });

        // Mobile app membaca/menulis is_default pada alamat.
        Schema::table('addresses', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('postal_code');
            $table->index(['user_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_default']);
            $table->dropColumn('is_default');
        });

        Schema::dropIfExists('driver_salaries');
        Schema::dropIfExists('drivers');
    }
};
