<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DeliveryResource;
use App\Models\Delivery;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeliveryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeAdmin($request);

        $query = Delivery::query()
            ->with(['truck', 'driver', 'order'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('order_id'), fn ($q) => $q->where('order_id', $request->integer('order_id')))
            ->orderByDesc('created_at');

        return DeliveryResource::collection($query->paginate($request->integer('per_page', 20))->withQueryString());
    }

    public function store(Request $request): DeliveryResource
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'truck_id' => ['nullable', 'integer', 'exists:trucks,id'],
            'driver_id' => ['nullable', 'integer', 'exists:users,id'],
            'pickup_address' => ['nullable', 'string'],
            'destination_address' => ['nullable', 'string'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:pending,assigned,in_transit,delivered,cancelled'],
            'scheduled_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $delivery = Delivery::create([
            ...$validated,
            'status' => $validated['status'] ?? 'pending',
        ]);

        return new DeliveryResource($delivery->load(['truck', 'driver', 'order']));
    }

    public function show(Request $request, Delivery $delivery): DeliveryResource
    {
        $user = $request->user();

        $order = $delivery->order;

        if (! $user->isAdmin() && ! ($order && $order->customer_id === $user->id)) {
            abort(403, 'Anda tidak berhak melihat pengiriman ini.');
        }

        return new DeliveryResource($delivery->load(['truck', 'driver', 'order']));
    }

    public function updateStatus(Request $request, Delivery $delivery): DeliveryResource
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,assigned,in_transit,delivered,cancelled'],
            'truck_id' => ['nullable', 'integer', 'exists:trucks,id'],
            'driver_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $delivery->update([
            ...$validated,
            'delivered_at' => $validated['status'] === 'delivered' ? now() : $delivery->delivered_at,
        ]);

        return new DeliveryResource($delivery->load(['truck', 'driver', 'order']));
    }

    public function destroy(Request $request, Delivery $delivery): JsonResponse
    {
        $this->authorizeAdmin($request);

        $delivery->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengiriman dihapus.',
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat mengelola pengiriman.');
        }
    }
}
