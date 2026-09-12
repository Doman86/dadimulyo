<?php

namespace App\Console\Commands;

use App\Models\DeviceToken;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Console\Command;

class FcmTestSendCommand extends Command
{
    protected $signature = 'fcm:test-send
                            {user? : ID user yang akan dikirimi push}
                            {--token= : Kirim langsung ke FCM token tertentu (tanpa lookup DB)}
                            {--title= : Judul notifikasi}
                            {--body= : Isi notifikasi}';

    protected $description = 'Test kirim push notification FCM ke satu user (verifikasi setup Firebase)';

    public function handle(FcmService $fcm): int
    {
        if (! $fcm->isConfigured()) {
            $this->error('FCM belum dikonfigurasi.');
            $this->newLine();
            $this->line('Yang dibutuhkan di .env:');
            $this->line('  FIREBASE_PROJECT_ID=<project id dari service account JSON>');
            $this->line('  FIREBASE_SERVICE_ACCOUNT=<path file JSON service account>');
            $this->newLine();
            $this->line('Langkah setup:');
            $this->line('  1. Firebase Console > Project settings > Service accounts');
            $this->line('  2. Generate new private key');
            $this->line('  3. Simpan mis. sebagai storage/firebase-service-account.json');

            return self::FAILURE;
        }

        $title = $this->option('title') ?? '🔔 Test Push Notification';
        $body = $this->option('body') ?? 'Jika kamu melihat notifikasi ini, FCM sudah berfungsi dengan baik.';

        // Mode 1: kirim langsung ke token tertentu.
        if ($directToken = $this->option('token')) {
            return $this->sendAndReport($fcm, $directToken, $title, $body);
        }

        // Mode 2: cari user di DB.
        $userId = $this->argument('user');

        if ($userId === null) {
            $this->showUserOverview();

            $userId = $this->ask('ID user yang mau dikirimi push');
        }

        $user = User::find($userId);

        if (! $user) {
            $this->error("User dengan ID {$userId} tidak ditemukan.");

            return self::FAILURE;
        }

        $tokens = DeviceToken::where('user_id', $user->id)->pluck('token');

        if ($tokens->isEmpty()) {
            $this->error("User {$user->name} (ID {$user->id}) belum punya FCM token terdaftar.");
            $this->line('Pastikan aplikasi mobile sudah login minimal sekali di device tersebut.');

            return self::FAILURE;
        }

        $this->info("Mengirim ke {$tokens->count()} device milik {$user->name}...");

        $successCount = 0;

        foreach ($tokens as $index => $token) {
            $successCount += $this->sendAndReport($fcm, $token, $title, $body, $index + 1) === self::SUCCESS ? 1 : 0;
        }

        $this->newLine();

        if ($successCount > 0) {
            $this->info("✅ Berhasil mengirim {$successCount}/{$tokens->count()} push notification. Setup FCM valid!");

            return self::SUCCESS;
        }

        $this->error('❌ Semua pengiriman gagal. Periksa kredensial service account / project id.');

        return self::FAILURE;
    }

    private function sendAndReport(FcmService $fcm, string $token, string $title, string $body, ?int $index = null): int
    {
        $label = $index !== null ? "Device #{$index}" : 'Token';
        $masked = substr($token, 0, 20) . '…';

        $this->line("{$label}: {$masked}");

        $result = $fcm->sendToToken($token, $title, $body, [
            'type' => 'test',
            'sent_via' => 'fcm:test-send',
        ]);

        if ($result['ok']) {
            $this->info("  ✅ Terkirim (HTTP {$result['status']})");

            return self::SUCCESS;
        }

        match (true) {
            $result['status'] === 404 || $result['status'] === 410 => $this->warn("  ⚠️ Token invalid ({$result['status']}) — sebaiknya dihapus dari device_tokens."),
            $result['status'] === 401 => $this->error('  ❌ 401 Unauthorized — service account JSON tidak valid / private key salah.'),
            $result['status'] === 403 => $this->error('  ❌ 403 Forbidden — pastikan project id benar & akun service account punya role Firebase Cloud Messaging API Admin.'),
            $result['status'] === 0 => $this->error("  ❌ Tidak bisa terhubung ke FCM: {$result['error']}"),
            default => $this->error("  ❌ HTTP {$result['status']}: {$result['error']}"),
        };

        return self::FAILURE;
    }

    private function showUserOverview(): void
    {
        $users = User::query()
            ->select('users.id', 'users.name', 'users.email')
            ->join('device_tokens', 'device_tokens.user_id', '=', 'users.id')
            ->distinct()
            ->orderBy('users.id')
            ->get();

        if ($users->isEmpty()) {
            $this->warn('Belum ada user punya FCM token terdaftar di tabel device_tokens.');

            return;
        }

        $this->table(
            ['ID', 'Nama', 'Email', 'Devices'],
            $users->map(fn (User $u) => [
                $u->id,
                $u->name,
                $u->email,
                DeviceToken::where('user_id', $u->id)->count(),
            ])->all(),
        );
    }
}
