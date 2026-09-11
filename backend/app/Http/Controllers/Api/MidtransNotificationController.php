<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MidtransNotificationController extends Controller
{
    public function handlePaymentNotification(Request $request): JsonResponse
    {
        $data = $request->all();

        // Midtrans sends various fields, extract key ones
        $orderId = data_get($data, 'order_id');
        $status = data_get($data, 'payment_type');
        $fraudStatus = data_get($data, 'fraud_status');
        $transactionStatus = data_get($data, 'transaction_status');
        $approvalCode = data_get($data, 'approval_code');
        $merchantId = data_get($data, 'merchant_id');

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

        // Update order status based on Midtrans transaction status
        if ($transactionStatus === 'settlement') {
            // Payment successful
            $order->update([
                'payment_status' => 'paid',
                'midtrans_order_id' => data_get($data, 'order_id'),
                'midtrans_transaction_id' => data_get($data, 'trans_id'),
            ]);

            // You can also update payment records here if needed
        } elseif ($transactionStatus === 'deny' || $transactionStatus === 'expire' || $transactionStatus === 'cancel') {
            // Payment failed
            $order->update([
                'payment_status' => 'failed',
            ]);
        } elseif ($transactionStatus === 'pending') {
            // Still pending, keep as is or update to pending
            $order->update([
                'payment_status' => 'pending',
            ]);
        }

        // Return success response to Midtrans
        // This is critical - Midtrans will retry if not 200 OK
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
                'midtrans_order_id' => data_get($data, 'order_id'),
                'midtrans_transaction_id' => data_get($data, 'trans_id'),
            ]);
        } elseif ($transactionStatus === 'expire' || $transactionStatus === 'cancel') {
            $order->update([
                'payment_status' => 'failed',
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

        // Update order with GoPay linking status
        $order->update([
            'payment_status' => $status ?? 'pending',
            'midtrans_payment_type' => 'gopay',
        ]);

        return response()->json([
            'status_code' => '200',
            'response_code' => '00',
            'message' => 'OK',
        ]);
    }
}