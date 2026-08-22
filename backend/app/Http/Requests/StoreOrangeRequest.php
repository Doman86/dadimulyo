<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isAdmin() || $user->hasRole('orange_seller'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'integer', 'exists:orange_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'grade' => ['nullable', 'string', 'max:50'],
            'price_per_kg' => ['required', 'numeric', 'min:0'],
            'wholesale_price' => ['nullable', 'numeric', 'min:0', 'lte:price_per_kg'],
            'stock_kg' => ['nullable', 'numeric', 'min:0'],
            'minimum_order_kg' => ['nullable', 'numeric', 'min:0'],
            'harvest_date' => ['nullable', 'date'],
            'farm_location' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
        ];
    }
}
