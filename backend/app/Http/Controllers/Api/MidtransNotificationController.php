<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MidtransNotificationController extends Controller
{
    public function handlePaymentNotification(Request $request): JsonResponse
    {
        $data = $request->all();

        $orderId = data_get($data, 'order_id');
        $transactionStatus = data_get($data, 'transaction_status');
        $fraudStatus = data_get($data, 'fraud_status');
        $transId = data_get($data, 'trans_id');
        $paymentType = data_get($data, 'payment_type');
        $approvalCode = data_get($data, 'approval_code');

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
            $transactionStatus === 'deny' ||
            $transactionStatus === 'expire' ||
            $transactionStatus === 'cancel'
        ) {
            $order->update([
                'payment_status' => 'failed',
                'payment_type' => $paymentType,
            ]);

            app(PushNotificationService::class)->notify(
                $order->customer_id,
                'Pembayaran gagal',
                "Pembayaran untuk pesanan {$order->order_number} gagal. Silakan coba lagi.",
                'payment',
                ['id' => $order->id, 'order_number' => $order->order_number, 'midtrans_transaction_id' => $transId],
            );
        } elseif ($transactionStatus === 'pending') {
            $order->update([
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