<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rental;
use App\Models\TruckOrder;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MidtransNotificationController extends Controller
{
    /**
     * Webhook pembayaran Midtrans.
     *
     * Order ID Midtrans memakai prefix untuk membedakan jenis transaksi:
     * - "JERUK-{id}"  -> pembelian jeruk (orders)
     * - "RENT-{id}"   -> sewa truck (rentals)
     * - "TRUCK-{id}"  -> pembelian truck (truck_orders)
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

        $payable = $this->resolvePayable($midtransOrderId);

        if (!$payable) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        if ($transactionStatus === 'settlement') {
            $payable->update([
                'payment_status' => 'paid',
                'midtrans_order_id' => $midtransOrderId,
                'midtrans_transaction_id' => $transId,
                'payment_type' => $paymentType,
            ]);

            // Perilaku lanjutan per jenis transaksi.
            if ($payable instanceof Order) {
                // Konfirmasi pesanan otomatis setelah pembayaran berhasil.
                $payable->update(['status' => 'confirmed']);

                if ($payable->delivery) {
                    $payable->delivery->update(['status' => 'ready']);
                }

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
        } elseif (
            $transactionStatus === 'deny' ||
            $transactionStatus === 'expire' ||
            $transactionStatus === 'cancel'
        ) {
            $payable->update([
                'payment_status' => 'failed',
                'payment_type' => $paymentType,
            ]);

            app(PushNotificationService::class)->notify(
                $payable->customer_id,
                'Pembayaran gagal',
                $payable instanceof Rental
                    ? "Pembayaran sewa truck #{$payable->id} gagal. Silakan coba lagi."
                    : 'Pembayaran gagal. Silakan coba lagi.',
                'payment',
                ['id' => $payable->id, 'midtrans_transaction_id' => $transId],
            );
        } elseif ($transactionStatus === 'pending') {
            $payable->update([
                'payment_status' => 'pending',
                'payment_type' => $paymentType,
            ]);
        }

        return response()->json([
            'status_code' => '200',
            'response_code' => '00',
            'message' => 'OK',
        ]);
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

        $order = Order::where('id', $orderId)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        if ($transactionStatus === 'settlement') {
            $order->update([
                'payment_status' => 'paid',
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

            // Jika ada delivery yang belum dikonfirmasi, siapkan untuk proses
            // pengiriman (status ready) — sesuaikan dengan alur bisnis.
            if ($order->delivery) {
                $order->delivery->update([
                    'status' => 'ready',
                ]);
            }

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

        $order = Order::where('id', $orderId)->first();

        if (!$order) {
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
