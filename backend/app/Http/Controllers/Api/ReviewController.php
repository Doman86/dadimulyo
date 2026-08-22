<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'truck_id' => ['nullable', 'integer', 'exists:trucks,id'],
            'orange_product_id' => ['nullable', 'integer', 'exists:orange_products,id'],
        ]);

        $reviews = Review::with('user:id,name')
            ->where('status', 'approved')
            ->when(isset($validated['truck_id']), fn ($q) => $q->where('truck_id', $validated['truck_id']))
            ->when(isset($validated['orange_product_id']), fn ($q) => $q->where('orange_product_id', $validated['orange_product_id']))
            ->latest()
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'review' => $review->review,
                'user_name' => $review->user?->name,
                'created_at' => $review->created_at,
            ]);

        return response()->json(['success' => true, 'data' => $reviews]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'truck_id' => ['nullable', 'integer', 'exists:trucks,id', 'required_without:orange_product_id'],
            'orange_product_id' => ['nullable', 'integer', 'exists:orange_products,id', 'required_without:truck_id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review' => ['required', 'string', 'max:2000'],
        ]);

        $review = Review::updateOrCreate(
            ['user_id' => $request->user()->id, 'truck_id' => $validated['truck_id'] ?? null, 'orange_product_id' => $validated['orange_product_id'] ?? null],
            ['rating' => $validated['rating'], 'review' => $validated['review'], 'status' => 'pending']
        );

        return response()->json(['success' => true, 'message' => 'Ulasan dikirim untuk moderasi.', 'data' => $review], 201);
    }
}
