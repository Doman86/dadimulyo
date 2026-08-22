<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_user_and_token(): void
    {
        $this->seed(RoleSeeder::class);

        $response = $this->postJson('/api/register', [
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'phone' => '081234567891',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['user' => ['id', 'name', 'email', 'role'], 'token'],
            ]);

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
        $this->assertDatabaseHas('users', ['role_id' => Role::where('name', 'customer')->first()->id]);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        $this->seed(RoleSeeder::class);

        $this->postJson('/api/register', [
            'name' => 'Budi',
            'email' => 'budi@example.com',
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

    public function test_login_returns_token(): void
    {
        $this->seed(RoleSeeder::class);

        User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'role_id' => Role::where('name', 'customer')->first()->id,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'budi@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $this->seed(RoleSeeder::class);

        User::create([
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'role_id' => Role::where('name', 'customer')->first()->id,
            'status' => 'active',
        ]);

        $this->postJson('/api/login', [
            'email' => 'budi@example.com',
            'password' => 'salah',
        ])->assertStatus(401);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $this->seed(RoleSeeder::class);

        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'role_id' => Role::where('name', 'customer')->first()->id,
            'status' => 'active',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'budi@example.com');
    }

    public function test_profile_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertStatus(401);
    }

    public function test_logout_revokes_token(): void
    {
        $this->seed(RoleSeeder::class);

        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'role_id' => Role::where('name', 'customer')->first()->id,
            'status' => 'active',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Guard instance is cached within a single test process; reset it so the
        // revoked token is re-evaluated against the database on the next request.
        $this->app->make('auth')->forgetGuards();

        $this->withToken($token)->getJson('/api/user')->assertStatus(401);
    }
}
