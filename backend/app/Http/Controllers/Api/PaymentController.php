<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMidtransRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Rental;
use App\Models\TruckOrder;
use App\Services\MidtransService;
use App\Services\PushNotificationService;
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

        // Pesanan DP (dp_online): Snap pertama = DP 50%, Snap kedua = pelunasan sisa.
        $isDpOrder = $type === 'order' && $payable->isDp();
        $isDpSettlement = $isDpOrder && $payable->payment_status === 'dp_paid';

        // Cegah payable yang sudah dibayar dibuat snap lagi.
        // Pesanan DP yang dp_paid tetap boleh — itu tahap pelunasan.
        if ($payable->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => $type === 'rental' ? 'Sewa ini sudah dibayar.' : 'Pesanan ini sudah dibayar.',
            ], 422);
        }

        // Nominal Snap: DP saat bayar pertama, sisa tagihan saat pelunasan.
        if ($isDpOrder) {
            $grossAmount = (int) ($isDpSettlement
                ? ceil($payable->remainingAmount())
                : round($payable->dp_amount > 0 ? $payable->dp_amount : $payable->dpAmount()));
        } else {
            $grossAmount = (int) $payable->{$config['amount_field']};
        }

        // Total harus lebih dari 0 agar Snap bisa dibuat.
        if ($grossAmount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Total pembayaran harus lebih dari 0.',
            ], 422);
        }

        // Order ID Midtrans: DP dan pelunasan memakai akhiran berbeda agar
        // webhook bisa membedakan tahap pembayarannya.
        $midtransOrderId = $config['prefix'] . '-' . $payable->id . ($isDpSettlement ? '-REMAIN' : ($isDpOrder ? '-DP' : ''));

        // Item details: order jeruk memakai item asli; rental & truck satu item ringkas.
        // Pesanan DP memakai item ringkas DP/pelunasan agar jumlahnya cocok dengan
        // gross_amount Snap ( Midtrans menolak bila item details tidak balance).
        if ($isDpOrder) {
            $itemDetails = [[
                'id' => ($isDpSettlement ? 'dp-remain-' : 'dp-') . $payable->id,
                'name' => mb_substr(($isDpSettlement ? 'Pelunasan ' : 'DP 50% ') . $payable->order_number, 0, 50),
                'quantity' => 1,
                'price' => $grossAmount,
                'category' => 'Product',
            ]];
        } elseif ($type === 'order' && $payable->items->isNotEmpty()) {
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

        // Pelunasan DP: catat payment record untuk sisa tagihan agar webhook
        // dapat menandainya paid saat settlement masuk.
        if ($isDpSettlement) {
            $payable->payments()->create([
                'payment_method' => 'online',
                'amount' => $grossAmount,
                'payable_type' => $type,
                'status' => 'pending',
                'notes' => 'Pelunasan DP 50% — dibayar via Midtrans.',
            ]);
        }

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
            'payment_method' => ['nullable', 'string', 'in:transfer,cod,face_to_face'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        // Nominal default: sisa tagihan untuk pelunasan DP, selain itu total tagihan.
        $isDpSettlement = $type === 'order' && $payable->isDp() && $payable->payment_status === 'dp_paid';
        $amount = $validated['amount'] ?? ($isDpSettlement
            ? $payable->remainingAmount()
            : (float) $payable->{$config['amount_field']});

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
    | Konfirmasi pembayaran tunai (face_to_face / COD)
    |
    | Hanya mengubah payment_status — order_status tetap mengikuti alur
    | order (pending -> confirmed -> processing -> shipping -> delivered
    | -> completed) dan TIDAK otomatis completed.
    |--------------------------------------------------------------------------
    */

    public function confirmCashPayment(Request $request, Order $order): JsonResponse
    {
        return $this->settleCashPayment($request, $order, true);
    }

    public function rejectCashPayment(Request $request, Order $order): JsonResponse
    {
        return $this->settleCashPayment($request, $order, false);
    }

    private function settleCashPayment(Request $request, Order $order, bool $confirmed): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat mengonfirmasi pembayaran.');
        }

        if ($confirmed && $order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah dibayar.',
            ], 422);
        }

        // Pesanan DP: konfirmasi admin berarti menerima pelunasan (sisa) tunai.
        if (! in_array($order->payment_method, ['face_to_face', 'cod'], true) && ! $order->isDp()) {
            return response()->json([
                'success' => false,
                'message' => 'Konfirmasi tunai hanya untuk metode face_to_face, cod, atau dp_online.',
            ], 422);
        }

        if ($confirmed) {
            $order->update(['payment_status' => 'paid']);
            $order->payments()->where('status', 'pending')->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            app(PushNotificationService::class)->notify(
                $order->customer_id,
                'Pembayaran diterima',
                "Pembayaran untuk pesanan {$order->order_number} telah dikonfirmasi.",
                'payment',
                ['id' => $order->id, 'order_number' => $order->order_number],
            );
        } else {
            // Ditolak / gagal: kembalikan ke unpaid agar bisa dibayar ulang.
            $order->update(['payment_status' => 'unpaid']);
            $order->payments()->where('status', 'pending')->update(['status' => 'failed']);

            app(PushNotificationService::class)->notify(
                $order->customer_id,
                'Pembayaran gagal',
                "Pembayaran untuk pesanan {$order->order_number} gagal dikonfirmasi. Silakan hubungi admin.",
                'payment',
                ['id' => $order->id, 'order_number' => $order->order_number],
            );
        }

        return response()->json([
            'success' => true,
            'message' => $confirmed ? 'Pembayaran tunai dikonfirmasi.' : 'Pembayaran tunai ditolak.',
            'data' => (new OrderResource($order->load(['customer', 'shippingAddress', 'items.orangeProduct', 'delivery.truck', 'delivery.driver', 'payments'])))->toArray($request),
        ]);
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
