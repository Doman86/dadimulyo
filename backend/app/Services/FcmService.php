<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Native FCM HTTP v1 client.
 *
 * Mengirim push notification langsung ke Firebase Cloud Messaging
 * menggunakan service account JSON (OAuth2 JWT) — tanpa package tambahan,
 * karena kreait/laravel-firebase belum support Laravel 13.
 *
 * Setup:
 * 1. Firebase Console > Project settings > Service accounts
 * 2. Generate new private key -> simpan sebagai backend/storage/firebase-service-account.json
 *    (atau set FIREBASE_SERVICE_ACCOUNT=path lain di .env)
 * 3. Copy project_id dari file JSON tersebut ke FIREBASE_PROJECT_ID di .env
 */
class FcmService
{
    private const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const FCM_SEND_URL = 'https://fcm.googleapis.com/v1/projects/%s/messages:send';

    private ?string $accessToken = null;

    private int $tokenExpiresAt = 0;

    public function isConfigured(): bool
    {
        return $this->credentialsPath() !== null
            && config('services.firebase.project_id') !== null;
    }

    /**
     * Kirim push notification ke sekumpulan FCM token.
     *
     * @param  array<int, string>  $tokens
     * @return array{sent: int, invalidTokens: array<int, string>}
     */
    public function sendToTokens(
        array $tokens,
        string $title,
        string $body,
        array $data = [],
    ): array {
        $result = ['sent' => 0, 'invalidTokens' => []];

        if (! $this->isConfigured()) {
            Log::info('FCM belum dikonfigurasi — push notification dilewati.');

            return $result;
        }

        $tokens = array_values(array_unique(array_filter($tokens)));

        foreach ($tokens as $token) {
            $payload = [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'data' => $this->stringifyData($data),
                    'android' => [
                        'priority' => 'high',
                    ],
                    'apns' => [
                        'payload' => [
                            'aps' => [
                                'sound' => 'default',
                            ],
                        ],
                    ],
                ],
            ];

            try {
                $response = Http::withToken($this->accessToken())
                    ->acceptJson()
                    ->post(sprintf(self::FCM_SEND_URL, config('services.firebase.project_id')), $payload);

                if ($response->successful()) {
                    $result['sent']++;
                } elseif (in_array($response->status(), [404, 410], true)) {
                    // Token tidak lagi valid (app di-uninstall dsb.) — tandai untuk dihapus.
                    $result['invalidTokens'][] = $token;
                } else {
                    Log::warning('FCM send gagal', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                }
            } catch (ConnectionException $e) {
                Log::warning('FCM connection error: ' . $e->getMessage());
            }
        }

        return $result;
    }

    /**
     * Ambil OAuth2 access token via service account JWT.
     * Di-cache sampai mendekati kadaluarsa (maks 1 jam).
     */
    private function accessToken(): string
    {
        if ($this->accessToken !== null && $this->tokenExpiresAt > (time() + 60)) {
            return $this->accessToken;
        }

        $credentials = json_decode(
            (string) file_get_contents($this->credentialsPath()),
            true,
        );

        $claims = [
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => self::OAUTH_TOKEN_URL,
            'iat' => time(),
            'exp' => time() + 3600,
        ];

        $jwt = $this->signJwt($claims, $credentials['private_key']);

        $response = Http::asForm()->post(self::OAUTH_TOKEN_URL, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException(
                'Gagal memperoleh FCM access token: ' . $response->body()
            );
        }

        $this->accessToken = $response->json('access_token');
        $this->tokenExpiresAt = time() + (int) $response->json('expires_in', 3600);

        return $this->accessToken;
    }

    private function signJwt(array $claims, string $privateKey): string
    {
        $header = $this->base64Url(json_encode([
            'alg' => 'RS256',
            'typ' => 'JWT',
        ]));

        $payload = $this->base64Url(json_encode($claims));

        $unsigned = $header . '.' . $payload;

        openssl_sign($unsigned, $signature, $privateKey, 'sha256WithRSAEncryption');

        return $unsigned . '.' . $this->base64Url($signature);
    }

    private function base64Url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function credentialsPath(): ?string
    {
        $path = config('services.firebase.service_account');

        if ($path === null || $path === '') {
            return null;
        }

        return realpath($path) ?: null;
    }

    /**
     * FCM data payload hanya boleh berisi string.
     */
    private function stringifyData(array $data): array
    {
        return collect($data)
            ->map(fn ($value) => is_scalar($value) ? (string) $value : json_encode($value))
            ->all();
    }
}
