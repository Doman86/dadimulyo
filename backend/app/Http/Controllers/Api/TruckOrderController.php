<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TruckOrderResource;
use App\Models\Truck;
use App\Models\TruckOrder;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TruckOrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = TruckOrder::query()
            ->with(['truck.images', 'customer', 'payments'])
            ->when($user->isAdmin(), fn ($q) => $q, fn ($q) => $q->where('customer_id', $user->id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->string('payment_status')->toString()))
            ->orderByDesc('created_at');

        return TruckOrderResource::collection($query->paginate($request->input('per_page', 20))->withQueryString());
    }

    public function store(Request $request): TruckOrderResource|JsonResponse
    {
        $validated = $request->validate([
            'truck_id' => ['required', 'integer', 'exists:trucks,id'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $truck = Truck::where('id', $validated['truck_id'])
            ->where('is_for_sale', true)
            ->where('status', 'available')
            ->first();

        if (! $truck) {
            return response()->json([
                'success' => false,
                'message' => 'Truck ini tidak tersedia untuk dibeli.',
            ], 422);
        }

        $truckOrder = DB::transaction(function () use ($request, $validated, $truck) {
            $truckOrder = TruckOrder::create([
                'truck_id' => $truck->id,
                'customer_id' => $request->user()->id,
                'order_number' => 'TRK' . now()->format('Ymd') . '-' . strtoupper(Str::random(6)),
                'recipient_name' => $validated['recipient_name'],
                'phone' => $validated['phone'],
                'notes' => $validated['notes'] ?? null,
                'amount' => $truck->price,
                'status' => 'pending',
                'payment_status' => 'unpaid',
            ]);

            // Tandai truck terjual supaya tidak dibeli orang lain bersamaan.
            $truck->update(['status' => 'sold']);

            return $truckOrder;
        });

        app(PushNotificationService::class)->notifyMany(
            \App\Models\Role::where('name', 'admin')->first()?->users->pluck('id') ?? collect(),
            'Order truck baru',
            "Order {$truckOrder->order_number} menunggu konfirmasi.",
            'truck_order',
            ['id' => $truckOrder->id, 'order_number' => $truckOrder->order_number],
        );

        return (new TruckOrderResource($truckOrder->load(['truck.images', 'customer', 'payments'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, TruckOrder $truckOrder): TruckOrderResource
    {
        $this->authorizeAccess($request, $truckOrder);

        return new TruckOrderResource($truckOrder->load(['truck.images', 'customer', 'payments']));
    }

    /**
     * Batalkan order truck oleh pembeli — hanya sebelum dibayar.
     * Truck otomatis tersedia kembali.
     */
    public function cancel(Request $request, TruckOrder $truckOrder): TruckOrderResource|JsonResponse
    {
        abort_unless($truckOrder->customer_id === $request->user()->id, 403);

        if ($truckOrder->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan yang sudah dibayar tidak dapat dibatalkan. Hubungi admin.',
            ], 422);
        }

        if (! in_array($truckOrder->status, ['pending', 'confirmed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan dengan status ini tidak dapat dibatalkan.',
            ], 422);
        }

        $truckOrder->update(['status' => 'cancelled']);
        $truckOrder->truck->update(['status' => 'available']);

        return new TruckOrderResource($truckOrder->load(['truck.images', 'customer', 'payments']));
    }

    /**
     * Update status order truck (admin): konfirmasi, proses, selesai, batalkan.
     * Set payment_status = paid otomatis menandai payment manual terkait sebagai terverifikasi.
     */
    public function updateStatus(Request $request, TruckOrder $truckOrder): TruckOrderResource|JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat mengubah status pesanan truck.');
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,confirmed,processing,completed,cancelled'],
            'payment_status' => ['nullable', 'string', 'in:unpaid,pending,paid,failed,refunded'],
        ]);

        if (isset($validated['status']) && $validated['status'] === 'cancelled') {
            if ($truckOrder->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan yang sudah dibayar tidak dapat dibatalkan. Gunakan refund.',
                ], 422);
            }
            $truckOrder->truck->update(['status' => 'available']);
        } elseif (isset($validated['status']) && $truckOrder->status === 'cancelled') {
            // Dibatalkan lalu diaktifkan lagi: truck dijual kembali.
            if ($truckOrder->truck->status === 'available') {
                $truckOrder->truck->update(['status' => 'sold']);
            }
        }

        $truckOrder->update($validated);

        // Verifikasi bukti transfer: payment manual ikut ditandai paid.
        if (($validated['payment_status'] ?? null) === 'paid') {
            $truckOrder->payments()->where('status', 'pending')->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            app(PushNotificationService::class)->notify(
                $truckOrder->customer_id,
                'Pembayaran diverifikasi',
                "Pembayaran untuk pesanan truck {$truckOrder->order_number} telah diverifikasi admin.",
                'payment',
                ['id' => $truckOrder->id, 'order_number' => $truckOrder->order_number],
            );
        }

        return new TruckOrderResource($truckOrder->load(['truck.images', 'customer', 'payments']));
    }

    private function authorizeAccess(Request $request, TruckOrder $truckOrder): void
    {
        $user = $request->user();

        if ($user->isAdmin() || $truckOrder->customer_id === $user->id) {
            return;
        }

        abort(403, 'Anda tidak berhak melihat pesanan ini.');
    }
}
