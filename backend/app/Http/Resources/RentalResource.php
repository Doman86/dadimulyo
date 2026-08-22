<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentalResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'truck_id' => $this->truck_id,
            'customer_id' => $this->customer_id,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'days' => $this->start_date && $this->end_date
                ? $this->start_date->diffInDays($this->end_date) + 1
                : 1,
            'price_per_day' => $this->price_per_day !== null ? (float) $this->price_per_day : null,
            'total_price' => $this->total_price !== null ? (float) $this->total_price : null,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'truck' => $this->whenLoaded('truck', fn () => [
                'id' => $this->truck?->id,
                'brand' => $this->truck?->brand,
                'model' => $this->truck?->model,
                'year' => $this->truck?->year,
                'rental_price_per_day' => $this->truck?->rental_price_per_day,
                'image_url' => $this->truck?->images->first()?->image_path
                    ? url('storage/' . $this->truck->images->first()->image_path)
                    : null,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
        ];
    }
}
