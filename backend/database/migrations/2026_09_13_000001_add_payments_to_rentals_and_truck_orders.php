<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kolom pembayaran Midtrans untuk sewa truck.
        Schema::table('rentals', function (Blueprint $table) {
            $table->string('payment_status')->default('unpaid')->after('status')->index();
            $table->string('midtrans_order_id')->nullable()->after('payment_status')->index();
            $table->string('midtrans_transaction_id')->nullable()->after('midtrans_order_id')->index();
            $table->string('payment_type')->nullable()->after('midtrans_transaction_id');
        });

        // Pembelian truck langsung dari web/mobile (tanpa perantara sales).
        Schema::create('truck_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->string('recipient_name')->nullable();
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('status')->default('pending')->index(); // pending, confirmed, processing, completed, cancelled
            $table->string('payment_status')->default('unpaid')->index(); // unpaid, pending, paid, failed, refunded
            $table->string('midtrans_order_id')->nullable()->index();
            $table->string('midtrans_transaction_id')->nullable()->index();
            $table->string('payment_type')->nullable();
            $table->timestamps();
        });

        // payments jadi multi-payable: order_id untuk jeruk, rental_id untuk sewa, truck_order_id untuk beli truck.
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('rental_id')->nullable()->after('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('truck_order_id')->nullable()->after('rental_id')->constrained()->cascadeOnDelete();
            $table->string('payable_type')->nullable()->after('truck_order_id')->index(); // order | rental | truck_order
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rental_id');
            $table->dropConstrainedForeignId('truck_order_id');
            $table->dropIndex(['payable_type']);
            $table->dropColumn('payable_type');
        });

        Schema::dropIfExists('truck_orders');

        Schema::table('rentals', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['midtrans_order_id']);
            $table->dropIndex(['midtrans_transaction_id']);
            $table->dropColumn(['payment_status', 'midtrans_order_id', 'midtrans_transaction_id', 'payment_type']);
        });
    }
};
