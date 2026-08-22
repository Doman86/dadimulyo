<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTruckRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $truck = $this->route('truck');

        if ($user === null) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        // Truck seller can only manage their own trucks.
        return $user->isTruckSeller() && $truck !== null && $truck->seller_id === $user->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'integer', 'exists:truck_categories,id'],
            'brand' => ['sometimes', 'string', 'max:255'],
            'model' => ['sometimes', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1950', 'max:' . (date('Y') + 1)],
            'price' => ['sometimes', 'numeric', 'min:0'],
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
