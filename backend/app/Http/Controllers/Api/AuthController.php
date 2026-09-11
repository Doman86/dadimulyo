<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\LoginOtpMail;
use App\Mail\PasswordResetMail;
use App\Models\LoginOtp;
use App\Models\PasswordReset;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

            // Jika OTP tidak diwajibkan (development) atau user adalah admin,
            // langsung beri token tanpa OTP.
            if (! config('auth.otp.required') || $user->isAdmin()) {
                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Registrasi berhasil.',
                    'data' => [
                        'needs_otp' => false,
                        'user' => $user->load('role'),
                        'token' => $token,
                    ],
                ], 201);
            }

            try {
                $this->issueOtp($user);
            } catch (\Exception $e) {
                report($e);
                // Registrasi tetap berhasil, tapi OTP gagal dikirim.
                // User diminta untuk meminta kode ulang.
                return response()->json([
                    'success' => true,
                    'message' => 'Akun berhasil dibuat, namun gagal mengirim kode verifikasi. Silakan coba "Kirim Ulang Kode".',
                    'data' => [
                        'needs_otp' => true,
                        'email' => $user->email,
                        'email_masked' => $this->maskEmail($user->email),
                        'expires_in' => config('auth.otp.expiry_minutes') * 60,
                        'user' => $user->load('role'),
                        'otp_sent' => false,
                    ],
                ], 201);
            }

            return response()->json([
                'success' => true,
                'message' => 'Akun berhasil dibuat. Kode verifikasi telah dikirim ke email Anda.',
                'data' => [
                    'needs_otp' => true,
                    'email' => $user->email,
                    'email_masked' => $this->maskEmail($user->email),
                    'expires_in' => config('auth.otp.expiry_minutes') * 60,
                    'user' => $user->load('role'),
                    'otp_sent' => true,
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

            // Jika OTP tidak diwajibkan (development) atau user adalah admin,
            // langsung beri token tanpa OTP.
            if (! config('auth.otp.required') || $user->isAdmin()) {
                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Login berhasil.',
                    'data' => [
                        'needs_otp' => false,
                        'user' => $user->load('role'),
                        'token' => $token,
                    ],
                ]);
            }

            try {
                $this->issueOtp($user);
            } catch (\Exception $e) {
                report($e);
                // Login tetap berhasil, tapi OTP gagal dikirim.
                return response()->json([
                    'success' => true,
                    'message' => 'Login berhasil, namun gagal mengirim kode verifikasi. Silakan coba "Kirim Ulang Kode".',
                    'data' => [
                        'needs_otp' => true,
                        'email' => $user->email,
                        'email_masked' => $this->maskEmail($user->email),
                        'expires_in' => config('auth.otp.expiry_minutes') * 60,
                        'otp_sent' => false,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Kode verifikasi telah dikirim ke email Anda.',
                'data' => [
                    'needs_otp' => true,
                    'email' => $user->email,
                    'email_masked' => $this->maskEmail($user->email),
                    'expires_in' => config('auth.otp.expiry_minutes') * 60,
                    'otp_sent' => true,
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

    public function verifyOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'string', 'email'],
                'code' => ['required', 'string', 'digits:' . config('auth.otp.digits')],
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (! $user || $user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode verifikasi tidak valid.',
                ], 422);
            }

            $otp = LoginOtp::where('user_id', $user->id)
                ->whereNull('used_at')
                ->where('expires_at', '>', now())
                ->latest('id')
                ->first();

            if (! $otp) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode verifikasi sudah kedaluwarsa. Silakan minta kode baru.',
                ], 422);
            }

            if ($otp->attempts >= (int) config('auth.otp.max_attempts')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan. Silakan minta kode baru.',
                ], 429);
            }

            if (! Hash::check($validated['code'], $otp->code)) {
                $otp->increment('attempts');
                return response()->json([
                    'success' => false,
                    'message' => 'Kode verifikasi salah.',
                    'errors' => ['code' => ['Kode verifikasi salah.']],
                ], 422);
            }

            $otp->update(['used_at' => now()]);

            if (! $user->email_verified_at) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Verifikasi berhasil. Selamat datang.',
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
                'message' => 'Terjadi kesalahan saat verifikasi. Silakan coba lagi.',
            ], 500);
        }
    }

    public function resendOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'string', 'email'],
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email tidak ditemukan.',
                ], 404);
            }

            $this->issueOtp($user);

            return response()->json([
                'success' => true,
                'message' => 'Kode verifikasi baru telah dikirim ke email Anda.',
                'data' => [
                    'needs_otp' => true,
                    'email' => $user->email,
                    'email_masked' => $this->maskEmail($user->email),
                    'expires_in' => config('auth.otp.expiry_minutes') * 60,
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
                'message' => 'Gagal mengirim kode verifikasi. Silakan coba lagi.',
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

    public function forgotPassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'string', 'email'],
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (! $user || $user->status !== 'active') {
                // Tetap return sukses agar tidak bocor info keberadaan email
                return response()->json([
                    'success' => true,
                    'message' => 'Jika email terdaftar, kode reset telah dikirim.',
                ]);
            }

            // Hapus reset lama
            PasswordReset::where('user_id', $user->id)->delete();

            $code = $this->generateCode();

            PasswordReset::create([
                'user_id' => $user->id,
                'code' => Hash::make($code),
                'expires_at' => now()->addMinutes((int) config('auth.otp.expiry_minutes')),
            ]);

            Mail::to($user->email)->send(new PasswordResetMail($code));

            return response()->json([
                'success' => true,
                'message' => 'Kode reset telah dikirim ke email Anda.',
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
                'message' => 'Gagal mengirim kode reset. Silakan coba lagi.',
            ], 500);
        }
    }

    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'string', 'email'],
                'token' => ['required', 'string', 'digits:6'],
                'password' => ['required', 'confirmed', Password::min(8)],
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (! $user || $user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Email tidak ditemukan.',
                ], 422);
            }

            $reset = PasswordReset::where('user_id', $user->id)
                ->whereNull('used_at')
                ->where('expires_at', '>', now())
                ->latest('id')
                ->first();

            if (! $reset) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode reset sudah kedaluwarsa. Silakan minta kode baru.',
                ], 422);
            }

            if ($reset->attempts >= (int) config('auth.otp.max_attempts')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan. Silakan minta kode baru.',
                ], 429);
            }

            if (! Hash::check($validated['token'], $reset->code)) {
                $reset->increment('attempts');
                return response()->json([
                    'success' => false,
                    'message' => 'Kode reset salah.',
                ], 422);
            }

            $reset->update(['used_at' => now()]);
            $user->update(['password' => $validated['password']]);

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil diubah. Silakan login.',
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
                'message' => 'Gagal reset password. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Hapus OTP lama user lalu buat OTP baru dan kirim ke email.
     */
    private function issueOtp(User $user): void
    {
        LoginOtp::where('user_id', $user->id)->delete();

        $code = $this->generateCode();

        LoginOtp::create([
            'user_id' => $user->id,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes((int) config('auth.otp.expiry_minutes')),
        ]);

        Mail::to($user->email)->send(new LoginOtpMail($code));
    }

    private function generateCode(): string
    {
        $digits = (int) config('auth.otp.digits');

        if ($digits === 6) {
            return (string) random_int(100000, 999999);
        }

        $min = (int) str_repeat('1', $digits);
        $max = (int) str_repeat('9', $digits);

        return (string) random_int(max($min, 10 ** ($digits - 1)), $max);
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);
        $visible = mb_strlen($local) <= 2 ? 1 : 2;

        return mb_substr($local, 0, $visible) . str_repeat('*', 3) . '@' . $domain;
    }
}