<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $roleName, string $email): User
    {
        $this->seed(RoleSeeder::class);

        return User::create([
            'name' => ucfirst($roleName),
            'email' => $email,
            'password' => 'password123',
            'role_id' => Role::where('name', $roleName)->first()->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_list_users(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $this->userWithRole('sales', 'sales@test.com');
        $this->userWithRole('customer', 'customer@test.com');

        $this->actingAs($admin)
            ->getJson('/api/users')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->actingAs($admin)
            ->getJson('/api/users?role=sales')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.role.name', 'sales');
    }

    public function test_non_admin_cannot_list_users(): void
    {
        $sales = $this->userWithRole('sales', 'sales@test.com');

        $this->actingAs($sales)->getJson('/api/users')->assertStatus(403);
    }
}
