<?php

namespace App\Services;

use App\Jobs\SendPushNotification;
use App\Models\DeviceToken;
use App\Models\Notification;
use App\Models\User;

/**
 * Menyimpan notifikasi ke database sekaligus mengirim
 * push notification FCM ke semua device milik user.
 *
 * Push dikirim asynchronously via queue — request API
 * tidak menunggu respons FCM. Jalankan `php artisan queue:work`
 * (atau queue:work --queue=push) untuk memproses job.
 */
class PushNotificationService
{
    public const QUEUE_NAME = 'push';

    public function __construct(private readonly FcmService $fcm)
    {
    }

    /**
     * Simpan notifikasi ke DB dan kirim push ke device user.
     */
    public function notify(
        int $userId,
        string $title,
        string $message,
        string $type = 'general',
        array $data = [],
    ): ?Notification {
        $notification = Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ]);

        $this->push($userId, $title, $message, $type, $data);

        return $notification;
    }

    /**
     * Dispatch push job ke queue untuk semua device milik seorang user.
     */
    public function push(
        int $userId,
        string $title,
        string $message,
        string $type = 'general',
        array $data = [],
    ): void {
        if (! $this->fcm->isConfigured()) {
            return;
        }

        $tokens = DeviceToken::where('user_id', $userId)->pluck('token')->all();

        if ($tokens === []) {
            return;
        }

        SendPushNotification::dispatch($tokens, $title, $message, [
            ...$data,
            'type' => $type,
        ])->onQueue(self::QUEUE_NAME)->afterCommit();
    }

    /**
     * Kirim push ke banyak user sekaligus (mis. semua admin & sales).
     *
     * @param  iterable<int, User|int>  $users
     */
    public function notifyMany(iterable $users, string $title, string $message, string $type = 'general', array $data = []): void
    {
        foreach ($users as $user) {
            $userId = $user instanceof User ? $user->id : (int) $user;

            $this->notify($userId, $title, $message, $type, $data);
        }
    }
}
