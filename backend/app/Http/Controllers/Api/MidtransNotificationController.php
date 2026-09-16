<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rental;
use App\Models\TruckOrder;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransNotificationController extends Controller
{
    /**
     * Webhook pembayaran Midtrans.
     *
     * Order ID Midtrans memakai prefix untuk membedakan jenis transaksi:
     * - "JERUK-{id}"       -> pembelian jeruk (orders)
     * - "JERUK-{id}-DP"    -> DP 50% pembelian jeruk (orders, metode dp_online)
     * - "JERUK-{id}-REMAIN"-> pelunasan DP pembelian jeruk (orders, metode dp_online)
     * - "RENT-{id}"        -> sewa truck (rentals)
     * - "TRUCK-{id}"       -> pembelian truck (truck_orders)
     */
    public function handlePaymentNotification(Request $request): JsonResponse
    {
        $data = $request->all();

        $midtransOrderId = data_get($data, 'order_id');
        $transactionStatus = data_get($data, 'transaction_status');
        $transId = data_get($data, 'transaction_id') ?? data_get($data, 'trans_id');
        $paymentType = data_get($data, 'payment_type');

        if (empty($midtransOrderId)) {
            return response()->json([
                'success' => false,
                'message' => 'Order ID not provided',
            ], 400);
        }

        // Endpoint ini PUBLIC (tanpa auth), jadi satu-satunya bukti bahwa
        // request benar-benar dari Midtrans adalah signature_key:
        // sha512(order_id + status_code + gross_amount + server_key).
        if (! $this->isSignatureValid($request, (string) $midtransOrderId)) {
            Log::warning('Midtrans webhook: signature tidak valid', [
                'order_id' => $midtransOrderId,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid signature',
            ], 403);
        }

        $payable = $this->resolvePayable($midtransOrderId);

        if (!$payable) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        if ($transactionStatus === 'settlement') {
            // Pesanan DP (dp_online) punya dua tahap Midtrans yang dibedakan
            // dari akhiran order id: "-DP" (DP 50%) dan "-REMAIN" (pelunasan).
            $isDpOrder = $payable instanceof Order && $payable->isDp();
            $isDpStage = $isDpOrder && str_ends_with($midtransOrderId, '-DP');
            $isRemainStage = $isDpOrder && str_ends_with($midtransOrderId, '-REMAIN');

            if ($isDpStage) {
                // Tahap 1: DP 50% diterima — order jadi dp_paid, BELUM lunas.
                $payable->update([
                    'payment_status' => 'dp_paid',
                    'payment_method' => 'dp_online',
                    'midtrans_order_id' => $midtransOrderId,
                    'midtrans_transaction_id' => $transId,
                    'payment_type' => $paymentType,
                ]);

                // Verifikasi payment record DP (record pertama yang pending).
                $dpPayment = $payable->payments()->where('status', 'pending')->orderBy('id')->first();
                $dpPayment?->update(['status' => 'paid', 'payment_method' => 'online', 'paid_at' => now()]);

                // Konfirmasi pesanan otomatis setelah DP masuk (alur sama seperti lunas).
                if (in_array($payable->status, ['pending'])) {
                    $payable->update(['status' => 'confirmed']);
                }

                app(PushNotificationService::class)->notify(
                    $payable->customer_id,
                    'DP diterima',
                    "DP untuk pesanan {$payable->order_number} berhasil dikonfirmasi. Sisa tagihan " . number_format($payable->remainingAmount(), 0, ',', '.') . ' dibayar saat pelunasan.',
                    'payment',
                    ['id' => $payable->id, 'order_number' => $payable->order_number, 'midtrans_transaction_id' => $transId],
                );
            } elseif ($isRemainStage) {
                // Tahap 2: pelunasan diterima — order lunas penuh.
                $payable->update([
                    'payment_status' => 'paid',
                    'payment_method' => 'dp_online',
                    'midtrans_order_id' => $midtransOrderId,
                    'midtrans_transaction_id' => $transId,
                    'payment_type' => $paymentType,
                ]);

                // Verifikasi payment record pelunasan (record pending berikutnya).
                $remainPayment = $payable->payments()->where('status', 'pending')->orderBy('id')->first();
                $remainPayment?->update(['status' => 'paid', 'payment_method' => 'online', 'paid_at' => now()]);

                app(PushNotificationService::class)->notify(
                    $payable->customer_id,
                    'Pelunasan diterima',
                    "Pelunasan untuk pesanan {$payable->order_number} berhasil dikonfirmasi. Pesanan lunas.",
                    'payment',
                    ['id' => $payable->id, 'order_number' => $payable->order_number, 'midtrans_transaction_id' => $transId],
                );
            } else {
            $payable->update([
                'payment_status' => 'paid',
                // Order lama tanpa payment_method (sebelum kolom ada) dianggap online.
                'payment_method' => $payable->payment_method ?? 'online',
                'midtrans_order_id' => $midtransOrderId,
                'midtrans_transaction_id' => $transId,
                'payment_type' => $paymentType,
            ]);

            // Catat pembayaran online pada tabel payments (riwayat & laporan).
            $payable->payments()->where('status', 'pending')->update([
                'status' => 'paid',
                'payment_method' => 'online',
                'paid_at' => now(),
            ]);

            // Perilaku lanjutan per jenis transaksi.
            if ($payable instanceof Order) {
                // Konfirmasi pesanan otomatis setelah pembayaran berhasil.
                $payable->update(['status' => 'confirmed']);

                app(PushNotificationService::class)->notify(
                    $payable->customer_id,
                    'Pembayaran diterima',
                    "Pembayaran untuk pesanan {$payable->order_number} berhasil dikonfirmasi.",
                    'payment',
                    ['id' => $payable->id, 'order_number' => $payable->order_number, 'midtrans_transaction_id' => $transId],
                );
            } elseif ($payable instanceof Rental) {
                // Konfirmasi otomatis booking sewa setelah dibayar.
                if (in_array($payable->status, ['pending'])) {
                    $payable->update(['status' => 'confirmed']);
                }

                app(PushNotificationService::class)->notify(
                    $payable->customer_id,
                    'Pembayaran sewa diterima',
                    "Pembayaran sewa truck #{$payable->id} berhasil dikonfirmasi.",
                    'rental',
                    ['id' => $payable->id, 'midtrans_transaction_id' => $transId],
                );
            } elseif ($payable instanceof TruckOrder) {
                app(PushNotificationService::class)->notify(
                    $payable->customer_id,
                    'Pembayaran diterima',
                    "Pembayaran untuk pembelian truck {$payable->order_number} berhasil dikonfirmasi.",
                    'payment',
                    ['id' => $payable->id, 'order_number' => $payable->order_number, 'midtrans_transaction_id' => $transId],
                );
            }
            }
        } elseif (
            $transactionStatus === 'deny' ||
            $transactionStatus === 'expire' ||
            $transactionStatus === 'cancel'
        ) {
            // Pesanan DP yang DP-nya sudah masuk tidak boleh turun ke failed —
            // yang gagal hanya Snap pelunasannya; DP tetap dp_paid agar bisa dilunasi lagi.
            $dpAlreadyPaid = $payable instanceof Order && $payable->isDp() && $payable->payment_status === 'dp_paid';

            if (! $dpAlreadyPaid) {
                $payable->update([
                    'payment_status' => 'failed',
                    'payment_type' => $paymentType,
                ]);
            }

            if (! $dpAlreadyPaid) {
                $payable->payments()->where('status', 'pending')->update(['status' => 'failed']);
            }

            app(PushNotificationService::class)->notify(
                $payable->customer_id,
                'Pembayaran gagal',
                $dpAlreadyPaid
                    ? "Pelunasan untuk pesanan {$payable->order_number} gagal. DP tetap aman — silakan coba lunasi lagi."
                    : ($payable instanceof Rental
                        ? "Pembayaran sewa truck #{$payable->id} gagal. Silakan coba lagi."
                        : 'Pembayaran gagal. Silakan coba lagi.'),
                'payment',
                ['id' => $payable->id, 'midtrans_transaction_id' => $transId],
            );
        } elseif ($transactionStatus === 'pending') {
            // DP yang sudah masuk tidak boleh ditimpa status pending dari Snap pelunasan.
            if (! ($payable instanceof Order && $payable->isDp() && $payable->payment_status === 'dp_paid')) {
                $payable->update([
                    'payment_status' => 'pending',
                    'payment_type' => $paymentType,
                ]);
            }
        }

        return response()->json([
            'status_code' => '200',
            'response_code' => '00',
            'message' => 'OK',
        ]);
    }

    /**
     * Verifikasi signature_key notifikasi Midtrans.
     *
     * Rumus resmi: sha512(order_id + status_code + gross_amount + server_key).
     * gross_amount harus persis seperti yang dikirim (string "90000.00"),
     * karena Midtrans menghitung signature dari representasi aslinya.
     */
    private function isSignatureValid(Request $request, string $orderId): bool
    {
        $serverKey = (string) config('services.midtrans.server_key');

        // Tanpa server key, signature tidak bisa diverifikasi — jangan pernah
        // menerima notifikasi (mencegah pemalsuan saat konfigurasi lupa diisi).
        if ($serverKey === '') {
            return false;
        }

        $expected = hash(
            'sha512',
            $orderId
                . (string) $request->input('status_code', '')
                . (string) $request->input('gross_amount', '')
                . $serverKey,
        );

        return hash_equals($expected, (string) $request->input('signature_key', ''));
    }

    /**
     * Cari model payable berdasarkan prefix order id Midtrans.
     */
    private function resolvePayable(string $midtransOrderId): Order|Rental|TruckOrder|null
    {
        if (str_starts_with($midtransOrderId, 'RENT-')) {
            return Rental::find((int) substr($midtransOrderId, strlen('RENT-')));
        }

        if (str_starts_with($midtransOrderId, 'TRUCK-')) {
            return TruckOrder::find((int) substr($midtransOrderId, strlen('TRUCK-')));
        }

        // Order jeruk: dukung format lama (plain id) dan baru ("JERUK-{id}").
        $numericId = str_starts_with($midtransOrderId, 'JERUK-')
            ? substr($midtransOrderId, strlen('JERUK-'))
            : $midtransOrderId;

        return Order::find((int) $numericId);
    }

    public function handleRecurringNotification(Request $request): JsonResponse
    {
        $data = $request->all();

        $orderId = data_get($data, 'order_id');
        $transactionStatus = data_get($data, 'transaction_status');
        $transId = data_get($data, 'trans_id');
        $paymentType = data_get($data, 'payment_type');

        if (empty($orderId)) {
            return response()->json([
                'success' => false,
                'message' => 'Order ID not provided',
            ], 400);
        }

        // Order ID bisa berupa "JERUK-{id}" / id polos — gunakan resolver yang sama
        // dengan handlePaymentNotification.
        $order = $this->resolvePayable($orderId);

        if (!$order instanceof Order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        if ($transactionStatus === 'settlement') {
            $order->update([
                'payment_status' => 'paid',
                'payment_method' => $order->payment_method ?? 'online',
                'midtrans_order_id' => $orderId,
                'midtrans_transaction_id' => $transId,
                'payment_type' => $paymentType,
            ]);

            // Opsional: konfirmasi pesanan otomatis setelah pembayaran berhasil.
            // Sesuaikan dengan alur bisnis. Hapus baris ini jika konfirmasi tetap
            // dilakukan oleh admin.
            $order->update([
                'status' => 'confirmed',
            ]);

            app(PushNotificationService::class)->notify(
                $order->customer_id,
                'Pembayaran diterima',
                "Pembayaran untuk pesanan {$order->order_number} berhasil dikonfirmasi.",
                'payment',
                ['id' => $order->id, 'order_number' => $order->order_number, 'midtrans_transaction_id' => $transId],
            );
        } elseif (
            $transactionStatus === 'expire' ||
            $transactionStatus === 'cancel'
        ) {
            $order->update([
                'payment_status' => 'failed',
                'payment_type' => $paymentType,
            ]);
        }

        return response()->json([
            'status_code' => '200',
            'response_code' => '00',
            'message' => 'OK',
        ]);
    }

    public function handleGoPayLinking(Request $request): JsonResponse
    {
        $data = $request->all();

        $orderId = data_get($data, 'order_id');
        $status = data_get($data, 'payment_status');

        if (empty($orderId)) {
            return response()->json([
                'success' => false,
                'message' => 'Order ID not provided',
            ], 400);
        }

        $order = $this->resolvePayable($orderId);

        if (!$order instanceof Order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        $order->update([
            'payment_status' => $status ?? 'pending',
            'payment_type' => 'gopay',
        ]);

        return response()->json([
            'status_code' => '200',
            'response_code' => '00',
            'message' => 'OK',
        ]);
    }
}
