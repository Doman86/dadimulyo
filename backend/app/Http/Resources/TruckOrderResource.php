<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TruckOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'recipient_name' => $this->recipient_name,
            'phone' => $this->phone,
            'notes' => $this->notes,
            'amount' => $this->amount !== null ? (float) $this->amount : null,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_type' => $this->payment_type,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'truck' => $this->whenLoaded('truck', fn () => [
                'id' => $this->truck?->id,
                'brand' => $this->truck?->brand,
                'model' => $this->truck?->model,
                'year' => $this->truck?->year,
                'price' => $this->truck?->price !== null ? (float) $this->truck->price : null,
                'image_url' => $this->truck?->images->first()?->image_path
                    ? url('storage/' . $this->truck->images->first()->image_path)
                    : null,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'payments' => $this->whenLoaded('payments', fn () => $this->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'payment_method' => $payment->payment_method,
                'amount' => $payment->amount !== null ? (float) $payment->amount : null,
                'status' => $payment->status,
                'paid_at' => $payment->paid_at,
                'created_at' => $payment->created_at,
                'proof_url' => $payment->proof_path ? Storage::disk('public')->url($payment->proof_path) : null,
            ])),
        ];
    }
}
