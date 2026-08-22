<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'truck_id' => $this->truck_id,
            'driver_id' => $this->driver_id,
            'pickup_address' => $this->pickup_address,
            'destination_address' => $this->destination_address,
            'shipping_cost' => $this->shipping_cost !== null ? (float) $this->shipping_cost : null,
            'status' => $this->status,
            'scheduled_at' => $this->scheduled_at?->format('Y-m-d H:i'),
            'delivered_at' => $this->delivered_at?->format('Y-m-d H:i'),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'truck' => $this->whenLoaded('truck', fn () => $this->truck ? [
                'id' => $this->truck->id,
                'brand' => $this->truck->brand,
                'model' => $this->truck->model,
            ] : null),
            'driver' => $this->whenLoaded('driver', fn () => $this->driver ? [
                'id' => $this->driver->id,
                'name' => $this->driver->name,
                'phone' => $this->driver->phone,
            ] : null),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order?->id,
                'order_number' => $this->order?->order_number,
                'total' => $this->order?->total !== null ? (float) $this->order->total : null,
            ]),
        ];
    }
}
