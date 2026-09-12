<?php

namespace App\Jobs;

use App\Services\FcmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Mengirim push notification FCM via queue
 * agar request API tidak menunggu respons FCM.
 *
 * Catatan: token invalid (404/410) tetap dibersihkan di sini,
 * bukan di PushNotificationService, karena hanya worker yang
 * benar-benar mengetahui token mana yang ditolak FCM.
 */
class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, string>  $tokens
     * @param  array<string, string>  $data
     */
    public function __construct(
        public array $tokens,
        public string $title,
        public string $body,
        public array $data = [],
    ) {
    }

    public int $tries = 3;

    public array $backoff = [30, 120];

    public function handle(FcmService $fcm): void
    {
        if (! $fcm->isConfigured()) {
            Log::info('FCM belum dikonfigurasi — push notification dilewati.', [
                'title' => $this->title,
            ]);

            return;
        }

        $result = $fcm->sendToTokens($this->tokens, $this->title, $this->body, $this->data);

        if ($result['invalidTokens'] !== []) {
            \App\Models\DeviceToken::whereIn('token', $result['invalidTokens'])->delete();
        }

        if ($result['sent'] === 0 && $result['invalidTokens'] === []) {
            // Semua token gagal dengan error yang bukan 404/410.
            // Melempar exception agar job di-retry sesuai $tries.
            throw new \RuntimeException(
                'Semua ' . count($this->tokens) . ' FCM token gagal dikirim.'
            );
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SendPushNotification gagal permanen', [
            'title' => $this->title,
            'tokens' => count($this->tokens),
            'error' => $exception->getMessage(),
        ]);
    }
}
