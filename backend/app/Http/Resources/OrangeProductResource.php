<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrangeProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'seller_id' => $this->seller_id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'grade' => $this->grade,
            'price_per_kg' => $this->price_per_kg !== null ? (float) $this->price_per_kg : null,
            'wholesale_price' => $this->wholesale_price !== null ? (float) $this->wholesale_price : null,
            'stock_kg' => $this->stock_kg !== null ? (float) $this->stock_kg : null,
            'minimum_order_kg' => $this->minimum_order_kg !== null ? (float) $this->minimum_order_kg : null,
            'harvest_date' => $this->harvest_date?->format('Y-m-d'),
            'farm_location' => $this->farm_location,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => $this->whenLoaded('category', fn () => new OrangeCategoryResource($this->category)),
            'seller' => $this->whenLoaded('seller', fn () => [
                'id' => $this->seller?->id,
                'name' => $this->seller?->name,
            ]),
            'images' => OrangeImageResource::collection($this->whenLoaded('images')),
            'reviews' => $this->whenLoaded('reviews', fn () => $this->reviews->map(fn ($review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'review' => $review->review,
                'user_name' => $review->user?->name,
                'created_at' => $review->created_at,
            ])),
        ];
    }
}
