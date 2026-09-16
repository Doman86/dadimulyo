<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Nominal DP yang sudah dibayar (setengah dari total saat metode dp_online).
            // Kolom ini hanya diisi untuk pesanan DP; sementara itu `total` tetap
            // menyimpan harga penuh sebagai acuan pelunasan.
            $table->decimal('dp_amount', 12, 2)->default(0)->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('dp_amount');
        });
    }
};
