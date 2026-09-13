<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMidtransRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function __construct(private MidtransService $midtrans)
    {
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 403);
        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:transfer,cod'],
            'amount' => ['required', 'numeric', 'min:0'],
            'proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $path = $request->file('proof')?->store('payments', 'public');
        $payment = $order->payments()->create([
            'payment_method' => $validated['payment_method'],
            'amount' => $validated['amount'],
            'proof_path' => $path,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'message' => 'Pembayaran dikirim untuk verifikasi.', 'data' => [
            'payment' => [...$payment->toArray(), 'proof_url' => $path ? Storage::disk('public')->url($path) : null],
        ]], 201);
    }

    /**
     * Hapus pembayaran (bukti transfer) yang masih pending — misal bukti salah unggah.
     */
    public function destroy(Request $request, Order $order, Payment $payment): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 403);
        abort_unless($payment->order_id === $order->id, 404);

        if ($payment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran yang sudah diverifikasi tidak dapat dihapus.',
            ], 422);
        }

        if ($payment->proof_path) {
            Storage::disk('public')->delete($payment->proof_path);
        }
        $payment->delete();

        return response()->json(['success' => true, 'message' => 'Bukti pembayaran dihapus.']);
    }

    /**
     * Buat Snap transaksi Midtrans untuk order ini.
     *
     * Endpoint ini dipanggil oleh mobile setelah order dibuat dan ingin langsung bayar.
     * Hanya pemilik order yang boleh memanggil endpoint ini.
     */
    public function createMidtransTransaction(CreateMidtransRequest $request, Order $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 403);

        // Cegah order yang sudah dibayar dibuat snap lagi.
        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah dibayar.',
            ], 422);
        }

        $validated = $request->validated();

        $items = $validated['items'] ?? [];
        $customerPayload = $validated['customer'] ?? [];

        if (empty($customerPayload)) {
            $user = $request->user();
            $customerPayload = [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ];
        }

        $itemDetails = [];
        if (empty($items)) {
            // Jika tidak diisi, buat item dari order.
            foreach ($order->items as $item) {
                $itemDetails[] = [
                    'name' => $item->orangeProduct?->name ?? 'Produk',
                    'quantity' => (int) $item->quantity_kg,
                    'price' => (int) $item->price_per_kg,
                    'category' => 'Product',
                    'id' => $item->orange_product_id,
                ];
            }
        } else {
            $itemDetails = $items;
        }

        $grossAmount = (int) $order->total;

        // Total harus lebih dari 0 agar Snap bisa dibuat.
        if ($grossAmount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Total pesanan harus lebih dari 0.',
            ], 422);
        }

        // Pastikan order belum dibayar (double check).
        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah dibayar.',
            ], 422);
        }

        $result = $this->midtrans->createSnap([
            'order_id' => (string) $order->id,
            'gross_amount' => $grossAmount,
            'items' => $itemDetails,
            'customer' => $customerPayload,
            'enabled_payments' => $validated['enabled_payments'] ?? ['gpay', 'shopeepay', 'va_bank', 'bca_va'],
        ]);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'] ?? 'Gagal membuat transaksi Midtrans.',
            ], 500);
        }

        $order->update([
            'midtrans_order_id' => $result['midtrans_order_id'],
            'payment_type' => 'snap',
        ]);

        $data = [
            'success' => true,
            'transaction' => [
                'order_id' => $order->id,
                'midtrans_order_id' => $result['midtrans_order_id'],
                'snap_token' => $result['snap_token'] ?? null,
                'redirect_url' => $result['redirect_url'] ?? null,
                'gross_amount' => $grossAmount,
                'client_key' => $this->midtrans->clientKey(),
                'is_production' => $this->midtrans->isProduction(),
            ],
        ];

        return response()->json($data, 201);
    }
}
