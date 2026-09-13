<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = Address::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateAddress($request);

        $address = DB::transaction(function () use ($request, $validated) {
            $makeDefault = $validated['is_default'] ?? false;

            // Jika ini alamat pertama, jadikan default otomatis.
            $isFirst = ! Address::where('user_id', $request->user()->id)->exists();
            $makeDefault = $makeDefault || $isFirst;

            if ($makeDefault) {
                Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
            }

            return Address::create(array_merge($validated, [
                'user_id' => $request->user()->id,
                'is_default' => $makeDefault,
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil disimpan.',
            'data' => $address,
        ], 201);
    }

    public function update(Request $request, Address $address): JsonResponse
    {
        abort_unless($address->user_id === $request->user()->id, 403, 'Anda tidak berhak mengubah alamat ini.');

        $validated = $this->validateAddress($request);

        $address = DB::transaction(function () use ($request, $address, $validated) {
            if ($validated['is_default'] ?? false) {
                Address::where('user_id', $request->user()->id)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }

            $address->update($validated);

            // Pastikan minimal satu alamat default.
            if (! Address::where('user_id', $request->user()->id)->where('is_default', true)->exists()) {
                $address->update(['is_default' => true]);
            }

            return $address->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil diperbarui.',
            'data' => $address,
        ]);
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        abort_unless($address->user_id === $request->user()->id, 403, 'Anda tidak berhak menghapus alamat ini.');

        $wasDefault = $address->is_default;
        $address->delete();

        // Alihkan default ke alamat lain bila default terhapus.
        if ($wasDefault) {
            Address::where('user_id', $request->user()->id)
                ->orderBy('id')
                ->first()
                ?->update(['is_default' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil dihapus.',
        ]);
    }

    public function setDefault(Request $request, Address $address): JsonResponse
    {
        abort_unless($address->user_id === $request->user()->id, 403, 'Anda tidak berhak mengubah alamat ini.');

        DB::transaction(function () use ($request, $address) {
            Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat utama diperbarui.',
            'data' => $address->fresh(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string', 'max:1000'],
            'village' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }
}
