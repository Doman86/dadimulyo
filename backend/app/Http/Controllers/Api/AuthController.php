<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'phone' => ['required', 'string', 'max:20'],
                'password' => ['required', 'confirmed', Password::min(8)],
            ]);

            $customerRole = Role::where('name', 'customer')->first();

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => $validated['password'],
                'role_id' => $customerRole?->id,
                'status' => 'active',
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil.',
                'data' => [
                    'user' => $user->load('role'),
                    'token' => $token,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat registrasi. Silakan coba lagi.',
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'string', 'email'],
                'password' => ['required', 'string'],
            ]);

            if (! Auth::attempt(['email' => $validated['email'], 'password' => $validated['password']])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email atau password salah.',
                ], 401);
            }

            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email atau password salah.',
                ], 401);
            }

            if ($user->status !== 'active') {
                Auth::logout();
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda tidak aktif.',
                ], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil.',
                'data' => [
                    'user' => $user->load('role'),
                    'token' => $token,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat login. Silakan coba lagi.',
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();
        } catch (\Throwable $e) {
            // Token mungkin sudah tidak valid — tetap lanjutkan logout
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak terotentikasi.',
                ], 401);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user->load('role'),
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pengguna.',
            ], 500);
        }
    }
}
