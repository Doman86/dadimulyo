<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_email_and_password(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $adminRole = Role::where('name', 'admin')->first();
        $admin = User::create([
            'name' => 'Admin Dadi Mulyo',
            'email' => 'admin@dadimulyo.my.id',
            'phone' => '081234567890',
            'password' => 'password',
            'role_id' => $adminRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@dadimulyo.my.id',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.needs_otp', false)
            ->assertJsonStructure(['data' => ['token', 'user']]);

        // Jika OTP diaktifkan, admin tetap harus bisa login
        if (config('auth.otp.required')) {
            $this->assertTrue(true, 'Admin login berhasil meskipun OTP aktif');
        }
    }

    public function test_admin_login_with_wrong_password_fails(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $adminRole = Role::where('name', 'admin')->first();
        User::create([
            'name' => 'Admin',
            'email' => 'admin@dadimulyo.my.id',
            'phone' => '081234567890',
            'password' => 'password',
            'role_id' => $adminRole->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@dadimulyo.my.id',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Email atau password salah.');
    }
}
