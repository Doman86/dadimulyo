<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class MidtransService
{
    private const SANDBOX_BASE_URL = 'https://app.sandbox.midtrans.com';
    private const PRODUCTION_BASE_URL = 'https://app.midtrans.com';

    private string $serverKey;
    private string $clientKey;
    private bool $isProduction;

    public function __construct()
    {
        $this->serverKey = config('services.midtrans.server_key') ?: (string) env('MIDTRANS_SERVER_KEY', '');
        $this->clientKey = config('services.midtrans.client_key') ?: (string) env('MIDTRANS_CLIENT_KEY', '');
        $this->isProduction = (bool) env('MIDTRANS_IS_PRODUCTION', false);
    }

    public function isProduction(): bool
    {
        return $this->isProduction;
    }

    public function baseUrl(): string
    {
        return $this->isProduction ? self::PRODUCTION_BASE_URL : self::SANDBOX_BASE_URL;
    }

    public function clientKey(): string
    {
        return $this->clientKey;
    }

    /**
     * Normalisasi item_details untuk Midtrans.
     *
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private function normalizeItems(array $items): array
    {
        $normalized = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $normalized[] = [
                'id' => $item['id'] ?? $item['product_id'] ?? null,
                'name' => $item['name'] ?? 'Produk',
                'price' => (int) ($item['price'] ?? 0),
                'quantity' => (int) ($item['quantity'] ?? 1),
                'category' => $item['category'] ?? 'Product',
            ];
        }

        return $normalized;
    }

    /**
     * Normalisasi customer_details untuk Midtrans.
     *
     * @param array<string, mixed> $customer
     * @return array<string, mixed>
     */
    private function normalizeCustomer(array $customer): array
    {
        return [
            'first_name' => $customer['first_name'] ?? '',
            'last_name' => $customer['last_name'] ?? '',
            'email' => $customer['email'] ?? '',
            'phone' => $customer['phone'] ?? '',
        ];
    }

    /**
     * Buat Snap transaction dan kembalikan data yang dibutuhkan frontend.
     *
     * @param array{order_id: string, gross_amount: int, items?: array, customer?: array, enabled_payments?: string[]} $payload
     * @return array{success: bool, snap_token?: string, redirect_url?: string, midtrans_order_id?: string, error?: string}
     */
    public function createSnap(array $payload): array
    {
        if ($this->serverKey === '') {
            return ['success' => false, 'error' => 'MIDTRANS_SERVER_KEY belum diatur.'];
        }

        $orderId = $payload['order_id'] ?? null;
        $grossAmount = (int) ($payload['gross_amount'] ?? 0);

        if (empty($orderId) || $grossAmount <= 0) {
            return ['success' => false, 'error' => 'order_id dan gross_amount wajib diisi'];
        }

        $body = [
            'order_id' => $orderId,
            'gross_amount' => $grossAmount,
            'item_details' => $this->normalizeItems($payload['items'] ?? []),
            'customer_details' => $this->normalizeCustomer($payload['customer'] ?? []),
            'enabled_payments' => $payload['enabled_payments'] ?? ['gpay', 'shopeepay', 'va_bank', 'bca_va', 'bva'],
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
            ])
                ->withOptions(['verify' => false])
                ->post($this->baseUrl() . '/v2/snap', $body);

            if ($response->successful()) {
                $data = $response->json();
                $snapToken = $data['snap_token'] ?? null;
                $redirectUrl = $data['redirect_url'] ?? null;

                return [
                    'success' => true,
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                    'midtrans_order_id' => $orderId,
                ];
            }

            Log::error('Midtrans snap failure', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['success' => false, 'error' => $response->json('error_message', 'Midtrans snap gagal')];
        } catch (\Throwable $e) {
            Log::error('Midtrans snap exception', [
                'order_id' => $orderId,
                'message' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => 'Midtrans gagal diakses: ' . $e->getMessage()];
        }
    }

    /**
     * CoreAPI charge (opsional), gunakan kalau butuh charge langsung.
     *
     * @param array{order_id: string, payment_type: string, amount: int, customer_details?: array, item_details?: array, cc_token?: string, vn_token?: string, mpi?: array, virtual_account?: array} $payload
     * @return array{success: bool, status_code?: string, transaction_status?: string, fraud_status?: string, order_id?: string, error?: string}
     */
    public function charge(array $payload): array
    {
        if ($this->serverKey === '') {
            return ['success' => false, 'error' => 'MIDTRANS_SERVER_KEY belum diatur.'];
        }

        $orderId = $payload['order_id'] ?? null;
        $paymentType = $payload['payment_type'] ?? 'gopay';
        $amount = (int) ($payload['amount'] ?? 0);

        if (empty($orderId) || $amount <= 0) {
            return ['success' => false, 'error' => 'order_id dan amount wajib diisi'];
        }

        $body = [
            'order_id' => $orderId,
            'payment_type' => $paymentType,
            'transaction_details' => [
                'gross_amount' => $amount,
                'order_id' => $orderId,
            ],
            'customer_details' => $payload['customer_details'] ?? [],
            'item_details' => $payload['item_details'] ?? [],
            'credit_card' => $payload['credit_card'] ?? [],
            'echannel' => $payload['echannel'] ?? null,
            'bca_va' => $payload['bca_va'] ?? null,
            'benni_va' => $payload['benni_va'] ?? null,
            'bca_mandiri_va' => $payload['bca_mandiri_va'] ?? null,
            'bri_va' => $payload['bri_va'] ?? null,
            'bank_transfer' => $payload['bank_transfer'] ?? null,
            'gopay' => $payload['gopay'] ?? null,
            'shopeepay' => $payload['shopeepay'] ?? null,
            'kredivo' => $payload['kredivo'] ?? null,
            'akunmandiri' => $payload['akunmandiri'] ?? null,
            'vr_bank' => $payload['vr_bank'] ?? null,
            'fpx' => $payload['fpx'] ?? null,
            'cimb_click' => $payload['cimb_click'] ?? null,
            'all_in_one' => $payload['all_in_one'] ?? null,
            'permata_va' => $payload['permata_va'] ?? null,
            'sinhvag' => $payload['sinhvag'] ?? null,
            'internet Banking' => $payload['internet_banking'] ?? null,
            'offline' => $payload['offline'] ?? null,
        ];

        // Kompatibilitas kemungkinan payload lama.
        if (isset($payload['cc_token'])) {
            $body['credit_card'] = $payload['cc_token'];
        }

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
            ])
                ->withOptions(['verify' => false])
                ->post($this->baseUrl() . '/v2/charge', $body);

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success' => true,
                    'status_code' => $data['status_code'] ?? null,
                    'transaction_status' => $data['transaction_status'] ?? null,
                    'fraud_status' => $data['fraud_status'] ?? null,
                    'order_id' => $data['order_id'] ?? $orderId,
                    'redirect_url' => $data['redirect_url'] ?? null,
                    'token' => $data['token'] ?? null,
                ];
            }

            Log::error('Midtrans charge failure', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['success' => false, 'error' => $response->json('error_message', 'Midtrans charge gagal')];
        } catch (\Throwable $e) {
            Log::error('Midtrans charge exception', [
                'order_id' => $orderId,
                'message' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => 'Midtrans gagal diakses: ' . $e->getMessage()];
        }
    }
}
