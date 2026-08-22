<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
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
}
