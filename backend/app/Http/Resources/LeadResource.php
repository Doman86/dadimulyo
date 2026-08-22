<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'sales_id' => $this->sales_id,
            'truck_id' => $this->truck_id,
            'name' => $this->name,
            'phone' => $this->phone,
            'message' => $this->message,
            'status' => $this->status,
            'source' => $this->source,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'truck' => $this->whenLoaded('truck', fn () => [
                'id' => $this->truck?->id,
                'brand' => $this->truck?->brand,
                'model' => $this->truck?->model,
            ]),
            'sales' => $this->whenLoaded('sales', fn () => $this->sales ? [
                'id' => $this->sales->id,
                'name' => $this->sales->name,
            ] : null),
        ];
    }
}
