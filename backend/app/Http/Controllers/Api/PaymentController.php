<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMidtransRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Rental;
use App\Models\TruckOrder;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function __construct(private MidtransService $midtrans)
    {
    }

    /**
     * Konfigurasi tipe payable (jeruk / sewa truck / beli truck):
     * class model, field nominal, dan prefix order id Midtrans.
     */
    private function payableConfig(string $type): ?array
    {
        return match ($type) {
            'order' => ['class' => Order::class, 'amount_field' => 'total', 'prefix' => 'JERUK'],
            'rental' => ['class' => Rental::class, 'amount_field' => 'total_price', 'prefix' => 'RENT'],
            'truck_order' => ['class' => TruckOrder::class, 'amount_field' => 'amount', 'prefix' => 'TRUCK'],
            default => null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Midtrans Snap
    |--------------------------------------------------------------------------
    */

    public function createMidtransTransaction(CreateMidtransRequest $request, Order $order): JsonResponse
    {
        return $this->midtransForPayable($request, $order, 'order');
    }

    public function createRentalMidtrans(Request $request, Rental $rental): JsonResponse
    {
        return $this->midtransForPayable($request, $rental, 'rental');
    }

    public function createTruckOrderMidtrans(Request $request, TruckOrder $truckOrder): JsonResponse
    {
        return $this->midtransForPayable($request, $truckOrder, 'truck_order');
    }

    private function midtransForPayable(Request $request, $payable, string $type): JsonResponse
    {
        $config = $this->payableConfig($type);
        abort_unless($config !== null, 404);
        abort_unless($payable->customer_id === $request->user()->id, 403);

        // Cegah payable yang sudah dibayar dibuat snap lagi.
        if ($payable->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => $type === 'rental' ? 'Sewa ini sudah dibayar.' : 'Pesanan ini sudah dibayar.',
            ], 422);
        }

        $grossAmount = (int) $payable->{$config['amount_field']};

        // Total harus lebih dari 0 agar Snap bisa dibuat.
        if ($grossAmount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Total pembayaran harus lebih dari 0.',
            ], 422);
        }

        $midtransOrderId = $config['prefix'] . '-' . $payable->id;

        // Item details: order jeruk memakai item asli; rental & truck satu item ringkas.
        if ($type === 'order' && $payable->items->isNotEmpty()) {
            $itemDetails = $payable->items->map(fn ($item) => [
                'id' => $item->orange_product_id,
                'name' => $item->orangeProduct?->name ?? 'Produk',
                'quantity' => (int) $item->quantity_kg,
                'price' => (int) $item->price_per_kg,
                'category' => 'Product',
            ])->all();
        } elseif ($type === 'rental') {
            $label = trim(($payable->truck?->brand ?? 'Truck') . ' ' . ($payable->truck?->model ?? ''));
            $itemDetails = [[
                'id' => 'rental-' . $payable->truck_id,
                'name' => mb_substr('Sewa ' . $label, 0, 50),
                'quantity' => 1,
                'price' => $grossAmount,
                'category' => 'Rental',
            ]];
        } else {
            $label = trim(($payable->truck?->brand ?? 'Truck') . ' ' . ($payable->truck?->model ?? ''));
            $itemDetails = [[
                'id' => 'truck-' . $payable->truck_id,
                'name' => mb_substr($label . ' (' . ($payable->truck?->year ?? '') . ')', 0, 50),
                'quantity' => 1,
                'price' => $grossAmount,
                'category' => 'Truck',
            ]];
        }

        $user = $request->user();
        $result = $this->midtrans->createSnap([
            'order_id' => $midtransOrderId,
            'gross_amount' => $grossAmount,
            'items' => $itemDetails,
            'customer' => [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'enabled_payments' => ['gpay', 'shopeepay', 'va_bank', 'bca_va'],
        ]);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'] ?? 'Gagal membuat transaksi Midtrans.',
            ], 500);
        }

        $payable->update([
            'midtrans_order_id' => $midtransOrderId,
            'payment_type' => 'snap',
        ]);

        return response()->json([
            'success' => true,
            'transaction' => [
                'order_id' => $payable->id,
                'midtrans_order_id' => $midtransOrderId,
                'snap_token' => $result['snap_token'] ?? null,
                'redirect_url' => $result['redirect_url'] ?? null,
                'gross_amount' => $grossAmount,
                'client_key' => $this->midtrans->clientKey(),
                'is_production' => $this->midtrans->isProduction(),
            ],
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Pembayaran manual (transfer / COD) + bukti
    |--------------------------------------------------------------------------
    */

    public function store(Request $request, Order $order): JsonResponse
    {
        return $this->storeManualForPayable($request, $order, 'order');
    }

    public function storeRentalPayment(Request $request, Rental $rental): JsonResponse
    {
        return $this->storeManualForPayable($request, $rental, 'rental');
    }

    public function storeTruckOrderPayment(Request $request, TruckOrder $truckOrder): JsonResponse
    {
        return $this->storeManualForPayable($request, $truckOrder, 'truck_order');
    }

    private function storeManualForPayable(Request $request, $payable, string $type): JsonResponse
    {
        $config = $this->payableConfig($type);
        abort_unless($config !== null, 404);
        abort_unless($payable->customer_id === $request->user()->id, 403);

        if ($payable->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => $type === 'rental' ? 'Sewa ini sudah dibayar.' : 'Pesanan ini sudah dibayar.',
            ], 422);
        }

        $validated = $request->validate([
            // Mobile mengirim bank_name/account_name/notes + proof; admin dashboard
            // mengirim payment_method + amount. Terima keduanya.
            'payment_method' => ['nullable', 'string', 'in:transfer,cod'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        // Nominal default = total tagihan payable.
        $amount = $validated['amount'] ?? (float) $payable->{$config['amount_field']};

        $path = $request->file('proof')?->store('payments', 'public');
        $payment = $payable->payments()->create([
            'payment_method' => $validated['payment_method'] ?? 'transfer',
            'amount' => $amount,
            'proof_path' => $path,
            'payable_type' => $type,
            'status' => 'pending',
            'notes' => trim(collect([
                $validated['bank_name'] ?? null,
                $validated['account_name'] ?? null,
                $validated['notes'] ?? null,
            ])->filter()->implode(' | ')) ?: null,
        ]);

        return response()->json(['success' => true, 'message' => 'Pembayaran dikirim untuk verifikasi.', 'data' => [
            'payment' => [...$payment->toArray(), 'proof_url' => $path ? Storage::disk('public')->url($path) : null],
        ]], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Hapus bukti pembayaran yang masih pending
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, Order $order, Payment $payment): JsonResponse
    {
        return $this->destroyForPayable($request, $order, $payment, 'order');
    }

    public function destroyRentalPayment(Request $request, Rental $rental, Payment $payment): JsonResponse
    {
        return $this->destroyForPayable($request, $rental, $payment, 'rental');
    }

    public function destroyTruckOrderPayment(Request $request, TruckOrder $truckOrder, Payment $payment): JsonResponse
    {
        return $this->destroyForPayable($request, $truckOrder, $payment, 'truck_order');
    }

    private function destroyForPayable(Request $request, $payable, Payment $payment, string $type): JsonResponse
    {
        $config = $this->payableConfig($type);
        abort_unless($config !== null, 404);
        abort_unless($payable->customer_id === $request->user()->id, 403);

        $foreignKey = match ($type) {
            'order' => 'order_id',
            'rental' => 'rental_id',
            'truck_order' => 'truck_order_id',
            default => abort(404),
        };

        abort_unless($payment->{$foreignKey} === $payable->id, 404);

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
}
