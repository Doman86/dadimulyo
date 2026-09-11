<?php

namespace Tests\Feature;

use App\Mail\LoginOtpMail;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_user_and_token_when_otp_disabled(): void
    {
        $this->seed(RoleSeeder::class);
        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'phone' => '081234567891',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        // When OTP disabled, should return token directly
        if (!config('auth.otp.required')) {
            $response->assertJsonPath('data.needs_otp', false)
                ->assertJsonStructure(['data' => ['token', 'user']]);
        } else {
            // When OTP enabled, should request OTP
            $response->assertJsonPath('data.needs_otp', true)
                ->assertJsonStructure([
                    'data' => ['needs_otp', 'email', 'email_masked', 'user' => ['id', 'name', 'email', 'role']],
                ]);
            Mail::assertSent(LoginOtpMail::class);
        }

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
        $this->assertDatabaseHas('users', ['role_id' => Role::where('name', 'customer')->first()->id]);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        $this->seed(RoleSeeder::class);

        $this->postJson('/api/register', [
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'phone' => '081234567891',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(201);

        $this->postJson('/api/register', [
            'name' => 'Budi Lagi',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    }

    public function test_login_returns_token_when_otp_disabled(): void
    {
        $this->seed(RoleSeeder::class);
        Mail::fake();

        $user = $this->createUser();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        if (!config('auth.otp.required')) {
            // OTP disabled - should return token directly
            $response->assertJsonPath('data.needs_otp', false)
                ->assertJsonStructure(['data' => ['token', 'user']]);
        } else {
            // OTP enabled - should request OTP
            $response->assertJsonPath('data.needs_otp', true)
                ->assertJsonPath('data.email_masked', 'bu***@example.com');
            Mail::assertSent(LoginOtpMail::class);
        }
    }

    public function test_verify_otp_returns_token_and_marks_email_verified(): void
    {
        // Only run this test when OTP is required
        if (!config('auth.otp.required')) {
            $this->markTestSkipped('OTP is not required in this environment');
        }

        $this->seed(RoleSeeder::class);
        Mail::fake();

        $user = $this->createUser();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $code = $this->latestSentCode();

        $response = $this->postJson('/api/login/verify', [
            'email' => $user->email,
            'code' => $code,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertNotNull(\App\Models\LoginOtp::where('user_id', $user->id)->first()->used_at);
    }

    public function test_verify_otp_rejects_wrong_code(): void
    {
        // Only run this test when OTP is required
        if (!config('auth.otp.required')) {
            $this->markTestSkipped('OTP is not required in this environment');
        }

        $this->seed(RoleSeeder::class);
        Mail::fake();

        $user = $this->createUser();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $validCode = $this->latestSentCode();
        $wrongCode = ($validCode === '123456') ? '654321' : '123456';

        $this->postJson('/api/login/verify', [
            'email' => $user->email,
            'code' => $wrongCode,
        ])->assertStatus(422);

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_resend_otp_invalidates_previous_code(): void
    {
        // Only run this test when OTP is required
        if (!config('auth.otp.required')) {
            $this->markTestSkipped('OTP is not required in this environment');
        }

        $this->seed(RoleSeeder::class);
        Mail::fake();

        $user = $this->createUser();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $firstCode = $this->latestSentCode();

        $this->postJson('/api/login/resend', [
            'email' => $user->email,
        ])->assertOk();

        $secondCode = $this->latestSentCode();
        $this->assertNotEquals($firstCode, $secondCode);

        $this->postJson('/api/login/verify', [
            'email' => $user->email,
            'code' => $firstCode,
        ])->assertStatus(422);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $this->seed(RoleSeeder::class);
        Mail::fake();

        $user = $this->createUser();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'salah',
        ])->assertStatus(401);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $this->seed(RoleSeeder::class);

        $user = $this->createUser();

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email);
    }

    public function test_profile_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertStatus(401);
    }

    public function test_logout_revokes_token(): void
    {
        $this->seed(RoleSeeder::class);

        $user = $this->createUser();

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Guard instance is cached within a single test process; reset it so the
        // revoked token is re-evaluated against the database on the next request.
        $this->app->make('auth')->forgetGuards();

        $this->withToken($token)->getJson('/api/user')->assertStatus(401);
    }

    private function createUser(): User
    {
        return User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'role_id' => Role::where('name', 'customer')->first()->id,
            'status' => 'active',
        ]);
    }

    private function latestSentCode(): string
    {
        $email = Mail::sent(LoginOtpMail::class)->last();
        if (!$email) {
            $this->markTestSkipped('No OTP email was sent');
        }
        return $email->code;
    }
}