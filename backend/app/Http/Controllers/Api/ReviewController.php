<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Daftar ulasan (approved) untuk truck / produk jeruk.
     * Mobile & admin membaca data.reviews + data.summary.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'truck_id' => ['nullable', 'integer', 'exists:trucks,id'],
            'orange_product_id' => ['nullable', 'integer', 'exists:orange_products,id'],
            // "all" = admin melihat semua status (untuk moderasi di dashboard).
            'status' => ['nullable', 'string', 'in:pending,approved,rejected,all'],
        ]);

        $query = Review::query()->with('user:id,name')
            ->when(isset($validated['truck_id']), fn ($q) => $q->where('truck_id', $validated['truck_id']))
            ->when(isset($validated['orange_product_id']), fn ($q) => $q->where('orange_product_id', $validated['orange_product_id']))
            // Admin boleh melihat semua status; publik hanya approved.
            // status=all (admin) => tanpa filter status.
            ->when(
                isset($validated['status']) && $validated['status'] !== 'all',
                fn ($q) => $q->when(
                    $request->user()?->isAdmin(),
                    fn ($q) => $q->where('status', $validated['status']),
                    fn ($q) => $q->where('status', 'approved')
                ),
                fn ($q) => $q->when(
                    ! $request->user()?->isAdmin(),
                    fn ($q) => $q->where('status', 'approved')
                )
            )
            ->latest();

        $reviews = $query->get();

        $items = $reviews->map(fn (Review $review) => [
            'id' => $review->id,
            'user_id' => $review->user_id,
            'user_name' => $review->user?->name,
            'truck_id' => $review->truck_id,
            'orange_product_id' => $review->orange_product_id,
            'rating' => $review->rating,
            // Kolom DB bernama "review"; kontrak klien (mobile & admin) memakai "comment".
            'comment' => $review->review,
            'reply' => $review->reply,
            'status' => $review->status,
            'created_at' => $review->created_at?->toIso8601String(),
            'updated_at' => $review->updated_at?->toIso8601String(),
        ]);

        $total = $reviews->count();

        $summary = [
            'average_rating' => $total > 0 ? round($reviews->avg('rating'), 2) : 0,
            'total_reviews' => $total,
            'rating_distribution' => [
                5 => $reviews->where('rating', 5)->count(),
                4 => $reviews->where('rating', 4)->count(),
                3 => $reviews->where('rating', 3)->count(),
                2 => $reviews->where('rating', 2)->count(),
                1 => $reviews->where('rating', 1)->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'reviews' => $items,
                'summary' => $summary,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Klien mobile mengirim "comment"; terima keduanya demi kompatibilitas.
        $validated = $request->validate([
            'truck_id' => ['nullable', 'integer', 'exists:trucks,id', 'required_without:orange_product_id'],
            'orange_product_id' => ['nullable', 'integer', 'exists:orange_products,id', 'required_without:truck_id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        // Satu ulasan per user per produk: perbarui yang sudah ada.
        $review = Review::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'truck_id' => $validated['truck_id'] ?? null,
                'orange_product_id' => $validated['orange_product_id'] ?? null,
            ],
            [
                'rating' => $validated['rating'],
                'review' => $validated['comment'],
                'status' => 'pending',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Ulasan dikirim untuk moderasi.',
            'data' => ['id' => $review->id, 'status' => $review->status],
        ], 201);
    }

    /**
     * Hapus ulasan (pemilik ulasan atau admin).
     */
    public function destroy(Request $request, Review $review): JsonResponse
    {
        abort_unless(
            $review->user_id === $request->user()->id || $request->user()->isAdmin(),
            403,
            'Anda tidak berhak menghapus ulasan ini.'
        );

        $review->delete();

        return response()->json(['success' => true, 'message' => 'Ulasan berhasil dihapus.']);
    }

    /**
     * Balas ulasan (admin) — dipakai dashboard admin.
     */
    public function reply(Request $request, Review $review): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat membalas ulasan.');
        }

        $validated = $request->validate([
            'reply' => ['required', 'string', 'max:2000'],
        ]);

        $review->update(['reply' => $validated['reply']]);

        return response()->json([
            'success' => true,
            'message' => 'Balasan berhasil disimpan.',
            'data' => $review->fresh(),
        ]);
    }
}
