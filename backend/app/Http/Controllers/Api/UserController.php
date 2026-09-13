<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat melihat daftar pengguna.');
        }

        $users = User::query()
            ->with('role')
            ->when($request->filled('role'), fn ($q) => $q->whereHas('role', fn ($r) => $r->where('name', $request->string('role')->toString())))
            ->orderBy('name')
            ->get();

        return JsonResource::collection($users->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
            ] : null,
            'status' => $user->status,
            'created_at' => $user->created_at,
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat membuat pengguna.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', 'in:admin,sales,truck_seller,orange_seller,customer,driver'],
        ]);

        $role = Role::where('name', $validated['role'])->firstOrFail();
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role_id' => $role->id,
            'status' => 'active',
        ])->load('role');

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dibuat.',
            'data' => ['user' => $user],
        ], 201);
    }

    /**
     * Update profil user yang sedang login (dipakai aplikasi mobile).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        if (array_key_exists('email', $validated) && $validated['email'] !== $user->email) {
            $validated['email_verified_at'] = null;
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => ['user' => $user->fresh()->load('role')],
        ]);
    }

    /**
     * Ganti password user yang sedang login (butuh password lama).
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password:sanctum'],
            'new_password' => ['required', 'confirmed', Password::min(8), 'different:current_password'],
        ], [
            'current_password.current_password' => 'Password saat ini tidak sesuai.',
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah.',
        ]);
    }
}
