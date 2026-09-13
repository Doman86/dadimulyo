<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Address;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrangeProduct;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /** Pesanan dengan jumlah ini ke atas memakai harga grosir. */
    private const BULK_THRESHOLD_KG = 50;

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Order::query()
            ->with(['customer', 'shippingAddress', 'items.orangeProduct', 'delivery.truck', 'delivery.driver', 'payments'])
            ->when($user->isAdmin(), fn ($q) => $q, fn ($q) => $q->where('customer_id', $user->id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->string('payment_status')->toString()))
            ->orderByDesc('created_at');

        return OrderResource::collection($query->paginate($request->input('per_page', 20))->withQueryString());
    }

    public function store(StoreOrderRequest $request): OrderResource|JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = $request->user();
            $items = $request->input('items');
            $needDriver = $request->boolean('need_driver', false);

            // Hitung total quantity kg dari semua items
            $totalQty = 0;
            $orderItems = [];
            $subtotal = 0;

            foreach ($items as $item) {
                $product = OrangeProduct::where('id', $item['orange_product_id'])
                    ->where('status', '!=', 'deleted')
                    ->first();

                if (! $product) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Produk tidak ditemukan.',
                    ], 422);
                }

                $qty = (float) $item['quantity_kg'];

                if ($qty < (float) $product->minimum_order_kg) {
                    return response()->json([
                        'success' => false,
                        'message' => "Minimum order {$product->name} adalah {$product->minimum_order_kg} kg.",
                    ], 422);
                }

                if ((float) $product->stock_kg < $qty) {
                    return response()->json([
                        'success' => false,
                        'message' => "Stok {$product->name} tidak mencukupi (tersisa {$product->stock_kg} kg).",
                    ], 422);
                }

                $totalQty += $qty;

                // Harga grosir berlaku untuk pembelian di atas ambang batas.
                $price = $qty >= self::BULK_THRESHOLD_KG && $product->wholesale_price !== null
                    ? (float) $product->wholesale_price
                    : (float) $product->price_per_kg;

                $orderItems[] = [
                    'orange_product_id' => $product->id,
                    'quantity_kg' => $qty,
                    'price_per_kg' => $price,
                    'subtotal' => $price * $qty,
                ];

                $subtotal += $price * $qty;

                // Kurangi stok.
                $product->decrement('stock_kg', $qty);
            }

            // Alamat pengiriman: pakai yang sudah ada atau buat baru.
            $address = null;
            if ($request->filled('shipping_address_id')) {
                $address = Address::where('id', $request->input('shipping_address_id'))
                    ->where('user_id', $user->id)
                    ->first();

                if (! $address) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Alamat pengiriman tidak valid.',
                    ], 422);
                }
            } elseif ($addressData = $request->input('address')) {
                $address = Address::create([
                    'user_id' => $user->id,
                    'label' => $addressData['label'] ?? 'Alamat utama',
                    'recipient_name' => $addressData['recipient_name'] ?? $user->name,
                    'phone' => $addressData['phone'] ?? $user->phone,
                    'address' => $addressData['address'],
                    'village' => $addressData['village'] ?? null,
                    'district' => $addressData['district'] ?? null,
                    'city' => $addressData['city'] ?? null,
                    'province' => $addressData['province'] ?? null,
                    'postal_code' => $addressData['postal_code'] ?? null,
                ]);
            }

            $shippingCost = (float) $request->input('shipping_cost', 0);

            $order = Order::create([
                'customer_id' => $user->id,
                'order_number' => 'DM' . now()->format('Ymd') . '-' . strtoupper(Str::random(6)),
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $subtotal + $shippingCost,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'shipping_address_id' => $address?->id,
                'notes' => $request->input('notes'),
            ]);

            foreach ($orderItems as $orderItem) {
                $order->items()->create($orderItem);
            }

            app(PushNotificationService::class)->notify(
                $user->id,
                'Pesanan dibuat',
                "Pesanan {$order->order_number} berhasil dibuat.",
                'order',
                ['id' => $order->id, 'order_number' => $order->order_number],
            );

            // Buat delivery bila diminta dan sopir tersedia
            if ($deliveryData = $request->input('delivery')) {
                $truckId = $deliveryData['truck_id'] ?? null;

                // Jika butuh sopir, tentukan truck_id berdasarkan ketersediaan
                $showDriverOption = $needDriver && $totalQty >= 700; // 7 kuwintal

                if ($showDriverOption && !$truckId) {
                    // Cari truck yang available untuk rental
                    $truck = \App\Models\Truck::where('is_for_rent', true)
                        ->where('status', 'available')
                        ->first();

                    if ($truck) {
                        $truckId = $truck->id;
                    }
                }

                $deliveryNotes = $deliveryData['notes'] ?? null;
                // Tambahkan catatan tentang butuh sopir
                if ($showDriverOption) {
                    $deliveryNotes = ($deliveryNotes ?? '') . ' | Sopir dibutuhkan (min 7 kuwintal)';
                }

                $order->delivery()->create([
                    'truck_id' => $truckId,
                    'pickup_address' => $deliveryData['pickup_address'] ?? 'Kebun Dadi Mulyo, Wagir, Malang',
                    'destination_address' => $address
                        ? collect([$address->address, $address->city, $address->province])->filter()->implode(', ')
                        : null,
                    'shipping_cost' => $shippingCost,
                    'status' => 'pending',
                    'scheduled_at' => $deliveryData['scheduled_at'] ?? null,
                    'notes' => $deliveryNotes,
                ]);
            }

            return (new OrderResource($order->load(['customer', 'shippingAddress', 'items.orangeProduct', 'delivery.truck', 'delivery.driver'])))
                ->response()
                ->setStatusCode(201);
        });
    }

    public function show(Request $request, Order $order): OrderResource
    {
        $this->authorizeAccess($request, $order);

        return new OrderResource($order->load(['customer', 'shippingAddress', 'items.orangeProduct', 'delivery.truck', 'delivery.driver', 'payments']));
    }

    public function updateStatus(Request $request, Order $order): OrderResource
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat mengubah status pesanan.');
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,confirmed,processing,completed,cancelled'],
            'payment_status' => ['nullable', 'string', 'in:unpaid,paid,refunded'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (isset($validated['shipping_cost'])) {
            $validated['total'] = $order->subtotal + (float) $validated['shipping_cost'];
        }

        $order->update($validated);

        app(PushNotificationService::class)->notify(
            $order->customer_id,
            'Status pesanan berubah',
            "Pesanan {$order->order_number} sekarang berstatus {$order->status}.",
            'order',
            ['id' => $order->id, 'order_number' => $order->order_number, 'status' => $order->status],
        );

        return new OrderResource($order->load(['customer', 'shippingAddress', 'items.orangeProduct', 'delivery.truck', 'delivery.driver']));
    }

    /**
     * Pembatalan pesanan oleh pembeli.
     * Hanya pending/confirmed yang boleh dibatalkan; stok produk dikembalikan.
     */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        $this->authorizeAccess($request, $order);

        if (! in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan dengan status ini tidak dapat dibatalkan.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        return DB::transaction(function () use ($order, $validated) {
            // Kembalikan stok setiap item produk.
            foreach ($order->items as $item) {
                if ($item->orange_product_id) {
                    OrangeProduct::where('id', $item->orange_product_id)
                        ->increment('stock_kg', (float) $item->quantity_kg);
                }
            }

            $order->update([
                'status' => 'cancelled',
                'notes' => trim(($order->notes ? $order->notes.' | ' : '').'Dibatalkan: '.($validated['reason'] ?? 'oleh pembeli')),
            ]);

            app(PushNotificationService::class)->notify(
                $order->customer_id,
                'Pesanan dibatalkan',
                "Pesanan {$order->order_number} telah dibatalkan.",
                'order',
                ['id' => $order->id, 'order_number' => $order->order_number, 'status' => 'cancelled'],
            );

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan.',
                'data' => ['id' => $order->id, 'status' => 'cancelled'],
            ]);
        });
    }

    /**
     * Validasi stok keranjang sebelum checkout (dipakai mobile).
     */
    public function validateCart(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.orange_product_id' => ['required', 'integer'],
            'items.*.quantity_kg' => ['required', 'numeric', 'min:0.1'],
        ]);

        $issues = [];

        foreach ($validated['items'] as $item) {
            $product = OrangeProduct::where('status', '!=', 'deleted')->find($item['orange_product_id']);

            if (! $product) {
                $issues[] = [
                    'orange_product_id' => $item['orange_product_id'],
                    'product_name' => 'Produk #'.$item['orange_product_id'],
                    'available' => 0,
                    'requested' => (float) $item['quantity_kg'],
                    'reason' => 'not_found',
                ];
                continue;
            }

            if ((float) $product->stock_kg < (float) $item['quantity_kg']) {
                $issues[] = [
                    'orange_product_id' => $product->id,
                    'product_name' => $product->name,
                    'available' => (float) $product->stock_kg,
                    'requested' => (float) $item['quantity_kg'],
                    'reason' => 'insufficient_stock',
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => $issues === [] ? 'Stok tersedia.' : 'Beberapa produk stoknya tidak mencukupi.',
            'data' => [
                'valid' => $issues === [],
                'issues' => $issues,
            ],
        ]);
    }

    private function authorizeAccess(Request $request, Order $order): void
    {
        $user = $request->user();

        if ($user->isAdmin() || $order->customer_id === $user->id) {
            return;
        }

        abort(403, 'Anda tidak berhak melihat pesanan ini.');
    }
}
