<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTruckRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isAdmin() || $user->isTruckSeller());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'integer', 'exists:truck_categories,id'],
            'brand' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1950', 'max:' . (date('Y') + 1)],
            'price' => ['required', 'numeric', 'min:0'],
            'rental_price_per_day' => ['nullable', 'numeric', 'min:0'],
            'rental_price_per_week' => ['nullable', 'numeric', 'min:0'],
            'mileage' => ['nullable', 'numeric', 'min:0'],
            'engine' => ['nullable', 'string', 'max:255'],
            'transmission' => ['nullable', 'string', 'max:100'],
            'fuel_type' => ['nullable', 'string', 'max:100'],
            'capacity' => ['nullable', 'string', 'max:100'],
            'condition' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'is_for_sale' => ['nullable', 'boolean'],
            'is_for_rent' => ['nullable', 'boolean'],
            'specifications' => ['nullable', 'array'],
            'specifications.*.key' => ['required_with:specifications', 'string', 'max:255'],
            'specifications.*.value' => ['required_with:specifications', 'string', 'max:255'],
        ];
    }
}
