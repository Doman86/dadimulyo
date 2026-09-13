<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Menyimpan info bukti transfer manual dari mobile:
        // "BCA | Budi Santoso | Sudah transfer via mobile banking".
        Schema::table('payments', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('proof_path');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
