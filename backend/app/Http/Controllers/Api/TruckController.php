<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTruckRequest;
use App\Http\Requests\UpdateTruckRequest;
use App\Http\Resources\TruckResource;
use App\Models\Truck;
use App\Models\TruckImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class TruckController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Truck::query()
            ->with(['category', 'images', 'seller'])
            ->where('status', '!=', 'deleted');

        // Search by brand/model
        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        // Filters
        $query->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->input('category_id')))
            ->when($request->filled('condition'), fn ($q) => $q->where('condition', $request->string('condition')->toString()))
            ->when($request->filled('fuel_type'), fn ($q) => $q->where('fuel_type', $request->string('fuel_type')->toString()))
            ->when($request->filled('transmission'), fn ($q) => $q->where('transmission', $request->string('transmission')->toString()))
            ->when($request->filled('min_price'), fn ($q) => $q->where('price', '>=', $request->float('min_price')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price', '<=', $request->float('max_price')))
            ->when($request->filled('is_for_sale'), fn ($q) => $q->where('is_for_sale', $request->boolean('is_for_sale')))
            ->when($request->filled('is_for_rent'), fn ($q) => $q->where('is_for_rent', $request->boolean('is_for_rent')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()));

        // Sorting
        $query->when($request->string('sort')->toString(), function ($q) use ($request) {
            match ($request->string('sort')->toString()) {
                'price_asc' => $q->orderBy('price', 'asc'),
                'price_desc' => $q->orderBy('price', 'desc'),
                'oldest' => $q->orderBy('created_at', 'asc'),
                default => $q->orderBy('created_at', 'desc'),
            };
        }, fn ($q) => $q->orderBy('created_at', 'desc'));

        return TruckResource::collection($query->paginate($request->input('per_page', 12))->withQueryString());
    }

    public function show(Truck $truck): TruckResource
    {
        abort_if($truck->status === 'deleted', 404);

        $truck->load(['category', 'images', 'specifications', 'seller', 'reviews.user']);

        return new TruckResource($truck);
    }

    public function store(StoreTruckRequest $request): TruckResource
    {
        $truck = Truck::create([
            ...$request->validated(),
            'seller_id' => $request->user()->id,
            'status' => $request->input('status', 'available'),
            'is_for_sale' => $request->boolean('is_for_sale', true),
            'is_for_rent' => $request->boolean('is_for_rent', false),
        ]);

        $this->syncSpecifications($truck, $request->input('specifications', []));

        return new TruckResource($truck->load(['category', 'images', 'specifications']));
    }

    public function update(UpdateTruckRequest $request, Truck $truck): TruckResource
    {
        abort_if($truck->status === 'deleted', 404);

        $truck->update($request->validated());

        if ($request->has('specifications')) {
            $this->syncSpecifications($truck, $request->input('specifications', []));
        }

        return new TruckResource($truck->load(['category', 'images', 'specifications']));
    }

    public function destroy(Truck $truck): JsonResponse
    {
        $user = request()->user();

        if (! $user->isAdmin() && $truck->seller_id !== $user->id) {
            abort(403, 'Anda tidak berhak menghapus truck ini.');
        }

        $truck->update(['status' => 'deleted']);

        return response()->json([
            'success' => true,
            'message' => 'Truck dihapus.',
        ]);
    }

    public function uploadImage(Request $request, Truck $truck): JsonResponse
    {
        $this->authorizeImageChange($truck);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $path = $request->file('image')->store('trucks', 'public');

        $image = $truck->images()->create([
            'image_path' => $path,
            'is_primary' => $request->boolean('is_primary', false),
            'sort_order' => $truck->images()->count(),
        ]);

        if ($image->is_primary) {
            $truck->images()->where('id', '!=', $image->id)->update(['is_primary' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Gambar berhasil diunggah.',
            'data' => ['image' => $image],
        ], 201);
    }

    public function deleteImage(Truck $truck, TruckImage $image): JsonResponse
    {
        $this->authorizeImageChange($truck);

        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gambar dihapus.',
        ]);
    }

    public function myWishlist(Request $request): AnonymousResourceCollection
    {
        $truckIds = $request->user()->wishlists()->pluck('truck_id');

        $trucks = Truck::whereIn('id', $truckIds)
            ->with(['category', 'images', 'seller'])
            ->orderByDesc('created_at')
            ->get();

        return TruckResource::collection($trucks);
    }

    public function toggleWishlist(Truck $truck): JsonResponse
    {
        $user = request()->user();
        $existing = $user->wishlists()->where('truck_id', $truck->id)->first();

        if ($existing) {
            $existing->delete();

            return response()->json([
                'success' => true,
                'message' => 'Dihapus dari wishlist.',
                'data' => ['wishlisted' => false],
            ]);
        }

        $user->wishlists()->create(['truck_id' => $truck->id]);

        return response()->json([
            'success' => true,
            'message' => 'Ditambahkan ke wishlist.',
            'data' => ['wishlisted' => true],
        ]);
    }

    private function syncSpecifications(Truck $truck, array $specifications): void
    {
        $truck->specifications()->delete();

        foreach ($specifications as $spec) {
            if (! empty($spec['key'])) {
                $truck->specifications()->create([
                    'key' => $spec['key'],
                    'value' => $spec['value'] ?? '',
                ]);
            }
        }
    }

    private function authorizeImageChange(Truck $truck): void
    {
        $user = request()->user();

        if ($user === null) {
            abort(401);
        }

        if (! $user->isAdmin() && $truck->seller_id !== $user->id) {
            abort(403, 'Anda tidak berhak mengubah gambar truck ini.');
        }
    }
}
