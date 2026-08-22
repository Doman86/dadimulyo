<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TruckResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'brand' => $this->brand,
            'model' => $this->model,
            'year' => $this->year,
            'price' => $this->price,
            'rental_price_per_day' => $this->rental_price_per_day,
            'rental_price_per_week' => $this->rental_price_per_week,
            'mileage' => $this->mileage,
            'engine' => $this->engine,
            'transmission' => $this->transmission,
            'fuel_type' => $this->fuel_type,
            'capacity' => $this->capacity,
            'condition' => $this->condition,
            'description' => $this->description,
            'location' => $this->location,
            'status' => $this->status,
            'is_for_sale' => $this->is_for_sale,
            'is_for_rent' => $this->is_for_rent,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => $this->whenLoaded('category', fn () => new TruckCategoryResource($this->category)),
            'seller' => $this->whenLoaded('seller', fn () => [
                'id' => $this->seller?->id,
                'name' => $this->seller?->name,
            ]),
            'images' => TruckImageResource::collection($this->whenLoaded('images')),
            'specifications' => TruckSpecificationResource::collection($this->whenLoaded('specifications')),
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
