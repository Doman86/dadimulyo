<?php

namespace App\Services;

use App\Models\DeviceToken;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Menyimpan notifikasi ke database sekaligus mengirim
 * push notification FCM ke semua device milik user.
 */
class PushNotificationService
{
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
     * Kirim push ke semua device milik seorang user.
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

        $result = $this->fcm->sendToTokens($tokens, $title, $message, [
            ...$data,
            'type' => $type,
        ]);

        // Bersihkan token yang sudah tidak valid (app di-uninstall, dsb).
        if ($result['invalidTokens'] !== []) {
            DeviceToken::whereIn('token', $result['invalidTokens'])->delete();
        }
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
