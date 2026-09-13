<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'subtotal' => $this->subtotal !== null ? (float) $this->subtotal : null,
            'shipping_cost' => $this->shipping_cost !== null ? (float) $this->shipping_cost : null,
            'total' => $this->total !== null ? (float) $this->total : null,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'shipping_address' => $this->whenLoaded('shippingAddress', fn () => $this->shippingAddress ? [
                'id' => $this->shippingAddress->id,
                'label' => $this->shippingAddress->label,
                'recipient_name' => $this->shippingAddress->recipient_name,
                'phone' => $this->shippingAddress->phone,
                'address' => $this->shippingAddress->address,
                'city' => $this->shippingAddress->city,
                'province' => $this->shippingAddress->province,
                'postal_code' => $this->shippingAddress->postal_code,
            ] : null),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'orange_product_id' => $item->orange_product_id,
                'product_name' => $item->orangeProduct?->name,
                'quantity_kg' => $item->quantity_kg !== null ? (float) $item->quantity_kg : null,
                'price_per_kg' => $item->price_per_kg !== null ? (float) $item->price_per_kg : null,
                'subtotal' => $item->subtotal !== null ? (float) $item->subtotal : null,
            ])),
            'delivery' => $this->whenLoaded('delivery', fn () => $this->delivery ? new DeliveryResource($this->delivery) : null),
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
