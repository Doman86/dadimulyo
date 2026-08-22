<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public: form "hubungi sales".
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'truck_id' => ['nullable', 'integer', 'exists:trucks,id'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'message' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'string', 'max:100'],
        ];
    }
}
