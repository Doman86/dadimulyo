<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateMidtransRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization diatur di controller dengan abort_unless.
        return true;
    }

    public function rules(): array
    {
        return [
            'enabled_payments' => ['nullable', 'array'],
            'enabled_payments.*' => ['string'],
            'customer' => ['nullable', 'array'],
            'customer.first_name' => ['nullable', 'string', 'max:255'],
            'customer.last_name' => ['nullable', 'string', 'max:255'],
            'customer.email' => ['nullable', 'email', 'max:255'],
            'customer.phone' => ['nullable', 'string', 'max:255'],
            'items' => ['nullable', 'array'],
            'items.*.name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
            'items.*.category' => ['nullable', 'string'],
            'items.*.id' => ['nullable', 'integer'],
        ];
    }
}
