<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // face_to_face | cod | online — dipilih saat checkout, sumber kebenaran dari DB.
            $table->string('payment_method')->nullable()->after('payment_status');
        });

        // Order lama yang sudah lunas dibayar via Midtrans (online).
        DB::table('orders')
            ->whereNull('payment_method')
            ->where('payment_status', 'paid')
            ->update(['payment_method' => 'online']);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
    }
};
