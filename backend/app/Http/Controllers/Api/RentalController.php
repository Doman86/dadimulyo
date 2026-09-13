<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RentalResource;
use App\Models\Rental;
use App\Models\Truck;
use App\Services\PushNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RentalController extends Controller
{
    private const ACTIVE_STATUSES = ['pending', 'confirmed', 'active'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Rental::query()
            ->with(['truck.images', 'customer'])
            ->when($user->isAdmin(), fn ($q) => $q, fn ($q) => $q->where('customer_id', $user->id))
            ->when($request->filled('truck_id'), fn ($q) => $q->where('truck_id', $request->input('truck_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->orderByDesc('created_at');

        return RentalResource::collection($query->paginate($request->input('per_page', 20))->withQueryString());
    }

    public function store(Request $request): RentalResource|JsonResponse
    {
        $validated = $request->validate([
            'truck_id' => ['required', 'integer', 'exists:trucks,id'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $truck = Truck::findOrFail($validated['truck_id']);

        if (! $truck->is_for_rent || $truck->status !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Truck ini tidak tersedia untuk disewa.',
            ], 422);
        }

        if ($truck->rental_price_per_day === null) {
            return response()->json([
                'success' => false,
                'message' => 'Harga sewa truck ini belum ditentukan.',
            ], 422);
        }

        $start = CarbonImmutable::parse($validated['start_date']);
        $end = CarbonImmutable::parse($validated['end_date']);
        $days = $start->diffInDays($end) + 1;

        if ($this->hasConflict($truck->id, $start, $end, null)) {
            return response()->json([
                'success' => false,
                'message' => 'Truck sudah dibooking pada rentang tanggal tersebut.',
            ], 422);
        }

        $rental = Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $request->user()->id,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'price_per_day' => $truck->rental_price_per_day,
            'total_price' => $truck->rental_price_per_day * $days,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        app(PushNotificationService::class)->notifyMany(
            \App\Models\Role::where('name', 'admin')->first()?->users->pluck('id') ?? collect(),
            'Booking rental baru',
            "Booking {$rental->id} menunggu konfirmasi.",
            'rental',
            ['id' => $rental->id],
        );

        return new RentalResource($rental->load(['truck.images', 'customer']));
    }

    public function show(Request $request, Rental $rental): RentalResource
    {
        $this->authorizeAccess($request, $rental);

        return new RentalResource($rental->load(['truck.images', 'customer']));
    }

    public function update(Request $request, Rental $rental): RentalResource|JsonResponse
    {
        $user = $request->user();

        // Customer can only cancel their own pending/confirmed rental.
        if (! $user->isAdmin()) {
            if ($rental->customer_id !== $user->id) {
                abort(403, 'Anda tidak berhak mengubah rental ini.');
            }

            $validated = $request->validate([
                'status' => ['required', 'string', 'in:cancelled'],
            ]);

            if (! in_array($rental->status, ['pending', 'confirmed'])) {
                abort(422, 'Rental dengan status ini tidak dapat dibatalkan.');
            }

            $rental->update(['status' => 'cancelled']);

            return new RentalResource($rental->load(['truck.images', 'customer']));
        }

        // Admin: manage dates, pricing, and status flow.
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,confirmed,active,completed,cancelled'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (isset($validated['start_date'], $validated['end_date'])) {
            $start = CarbonImmutable::parse($validated['start_date']);
            $end = CarbonImmutable::parse($validated['end_date']);
            $days = $start->diffInDays($end) + 1;

            $validated['total_price'] = $rental->price_per_day * $days;

            if ($this->hasConflict($rental->truck_id, $start, $end, $rental->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Truck sudah dibooking pada rentang tanggal tersebut.',
                ], 422);
            }
        }

        $rental->update($validated);

        return new RentalResource($rental->load(['truck.images', 'customer']));
    }

    public function destroy(Request $request, Rental $rental): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $rental->delete();

            return response()->json(['success' => true, 'message' => 'Rental dihapus.']);
        }

        if ($rental->customer_id !== $user->id || $rental->status !== 'pending') {
            abort(403, 'Anda tidak dapat menghapus rental ini.');
        }

        $rental->delete();

        return response()->json(['success' => true, 'message' => 'Booking dibatalkan.']);
    }

    public function availability(Request $request, Truck $truck): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $start = CarbonImmutable::parse($request->string('start_date')->toString());
        $end = CarbonImmutable::parse($request->string('end_date')->toString());

        $conflicts = $this->hasConflict($truck->id, $start, $end, null);

        return response()->json([
            'success' => true,
            'data' => [
                'truck_id' => $truck->id,
                'available' => ! $conflicts,
                'is_for_rent' => $truck->is_for_rent && $truck->status === 'available',
                'rental_price_per_day' => $truck->rental_price_per_day !== null ? (float) $truck->rental_price_per_day : null,
                'rental_price_per_week' => $truck->rental_price_per_week !== null ? (float) $truck->rental_price_per_week : null,
            ],
        ]);
    }

    public function calendar(Request $request, Truck $truck): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = CarbonImmutable::parse($request->input('from', today()->toDateString()));
        $to = CarbonImmutable::parse($request->input('to', $from->addMonths(3)->toDateString()));

        $bookings = Rental::query()
            ->where('truck_id', $truck->id)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->whereDate('end_date', '>=', $from)
            ->whereDate('start_date', '<=', $to)
            ->orderBy('start_date')
            ->get(['start_date', 'end_date', 'status']);

        return response()->json([
            'success' => true,
            'data' => [
                'truck_id' => $truck->id,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'bookings' => $bookings,
            ],
        ]);
    }

    private function hasConflict(int $truckId, CarbonImmutable $start, CarbonImmutable $end, ?int $excludeId): bool
    {
        return Rental::where('truck_id', $truckId)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhereBetween('end_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhere(function ($q2) use ($start, $end) {
                        $q2->where('start_date', '<=', $start->toDateString())
                            ->where('end_date', '>=', $end->toDateString());
                    });
            })
            ->exists();
    }

    private function authorizeAccess(Request $request, Rental $rental): void
    {
        $user = $request->user();

        if ($user->isAdmin() || $rental->customer_id === $user->id) {
            return;
        }

        abort(403, 'Anda tidak berhak melihat rental ini.');
    }
}
