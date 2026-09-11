<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.orange_product_id' => ['required', 'integer', 'exists:orange_products,id'],
            'items.*.quantity_kg' => ['required', 'numeric', 'min:0.5'],
            'shipping_address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'address.label' => ['nullable', 'string', 'max:255'],
            'address.recipient_name' => ['nullable', 'string', 'max:255'],
            'address.phone' => ['nullable', 'string', 'max:20'],
            'address.address' => ['required_without:shipping_address_id', 'string'],
            'address.village' => ['nullable', 'string', 'max:255'],
            'address.district' => ['nullable', 'string', 'max:255'],
            'address.city' => ['nullable', 'string', 'max:255'],
            'address.province' => ['nullable', 'string', 'max:255'],
            'address.postal_code' => ['nullable', 'string', 'max:10'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'need_driver' => ['nullable', 'boolean'],
            'delivery' => ['nullable', 'array'],
            'delivery.truck_id' => ['nullable', 'integer', 'exists:trucks,id'],
            'delivery.pickup_address' => ['nullable', 'string'],
            'delivery.scheduled_at' => ['nullable', 'date'],
            'delivery.notes' => ['nullable', 'string'],
        ];
    }
}
