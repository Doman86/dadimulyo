<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrangeRequest;
use App\Http\Requests\UpdateOrangeRequest;
use App\Http\Resources\OrangeProductResource;
use App\Models\OrangeImage;
use App\Models\OrangeProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class OrangeProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = OrangeProduct::query()
            ->with(['category', 'images', 'seller'])
            ->where('status', '!=', 'deleted');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('farm_location', 'like', "%{$search}%");
            });
        }

        $query->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('grade'), fn ($q) => $q->where('grade', $request->string('grade')->toString()))
            ->when($request->filled('min_price'), fn ($q) => $q->where('price_per_kg', '>=', $request->float('min_price')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price_per_kg', '<=', $request->float('max_price')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('in_stock'), fn ($q) => $q->where('stock_kg', '>', 0));

        $query->when($request->string('sort')->toString(), function ($q) use ($request) {
            match ($request->string('sort')->toString()) {
                'price_asc' => $q->orderBy('price_per_kg', 'asc'),
                'price_desc' => $q->orderBy('price_per_kg', 'desc'),
                'oldest' => $q->orderBy('created_at', 'asc'),
                default => $q->orderBy('created_at', 'desc'),
            };
        }, fn ($q) => $q->orderBy('created_at', 'desc'));

        return OrangeProductResource::collection($query->paginate($request->integer('per_page', 12))->withQueryString());
    }

    public function show(OrangeProduct $orange): OrangeProductResource
    {
        abort_if($orange->status === 'deleted', 404);

        $orange->load(['category', 'images', 'seller', 'reviews.user']);

        return new OrangeProductResource($orange);
    }

    public function store(StoreOrangeRequest $request): OrangeProductResource
    {
        $product = OrangeProduct::create([
            ...$request->validated(),
            'seller_id' => $request->user()->id,
            'status' => $request->input('status', 'available'),
            'stock_kg' => $request->input('stock_kg', 0),
            'minimum_order_kg' => $request->input('minimum_order_kg', 1),
        ]);

        return new OrangeProductResource($product->load(['category', 'images']));
    }

    public function update(UpdateOrangeRequest $request, OrangeProduct $orange): OrangeProductResource
    {
        abort_if($orange->status === 'deleted', 404);

        $orange->update($request->validated());

        return new OrangeProductResource($orange->load(['category', 'images']));
    }

    public function destroy(OrangeProduct $orange): JsonResponse
    {
        $user = request()->user();

        if (! $user->isAdmin() && $orange->seller_id !== $user->id) {
            abort(403, 'Anda tidak berhak menghapus produk ini.');
        }

        $orange->update(['status' => 'deleted']);

        return response()->json([
            'success' => true,
            'message' => 'Produk dihapus.',
        ]);
    }

    public function uploadImage(Request $request, OrangeProduct $orange): JsonResponse
    {
        $this->authorizeImageChange($orange);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $path = $request->file('image')->store('oranges', 'public');

        $image = $orange->images()->create([
            'image_path' => $path,
            'is_primary' => $request->boolean('is_primary', false),
            'sort_order' => $orange->images()->count(),
        ]);

        if ($image->is_primary) {
            $orange->images()->where('id', '!=', $image->id)->update(['is_primary' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Gambar berhasil diunggah.',
            'data' => ['image' => $image],
        ], 201);
    }

    public function deleteImage(OrangeProduct $orange, OrangeImage $image): JsonResponse
    {
        $this->authorizeImageChange($orange);

        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gambar dihapus.',
        ]);
    }

    private function authorizeImageChange(OrangeProduct $orange): void
    {
        $user = request()->user();

        if ($user === null) {
            abort(401);
        }

        if (! $user->isAdmin() && $orange->seller_id !== $user->id) {
            abort(403, 'Anda tidak berhak mengubah gambar produk ini.');
        }
    }
}
