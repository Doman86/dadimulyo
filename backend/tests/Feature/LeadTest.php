<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Role;
use App\Models\Truck;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadTest extends TestCase
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

    public function test_public_can_submit_lead(): void
    {
        $truck = Truck::create([
            'brand' => 'Hino',
            'model' => 'Dutro 130',
            'price' => 450000000,
            'status' => 'available',
            'is_for_sale' => true,
            'is_for_rent' => false,
        ]);

        $this->postJson('/api/leads', [
            'truck_id' => $truck->id,
            'name' => 'Budi',
            'phone' => '08123456789',
            'message' => 'Apakah masih tersedia?',
            'source' => 'web',
        ])->assertStatus(201)
            ->assertJsonPath('data.status', 'new')
            ->assertJsonPath('data.truck.brand', 'Hino');

        $this->assertDatabaseHas('leads', ['name' => 'Budi', 'status' => 'new']);
    }

    public function test_lead_requires_name_and_phone(): void
    {
        $this->postJson('/api/leads', [])->assertStatus(422);
    }

    public function test_authenticated_lead_linked_to_customer(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');

        $this->actingAs($customer)
            ->postJson('/api/leads', [
                'name' => 'Budi',
                'phone' => '08123456789',
            ])->assertStatus(201)
            ->assertJsonPath('data.customer_id', $customer->id);
    }

    public function test_sales_can_list_and_update_leads(): void
    {
        $sales = $this->userWithRole('sales', 'sales@test.com');
        $lead = Lead::create([
            'name' => 'Budi',
            'phone' => '08123456789',
            'status' => 'new',
        ]);

        $this->actingAs($sales)
            ->getJson('/api/leads')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($sales)
            ->putJson("/api/leads/{$lead->id}", [
                'status' => 'contacted',
                'notes' => 'Sudah dihubungi via WA.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'contacted');
    }

    public function test_customer_cannot_list_leads(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');

        $this->actingAs($customer)->getJson('/api/leads')->assertStatus(403);
    }

    public function test_admin_can_delete_lead(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $lead = Lead::create([
            'name' => 'Budi',
            'phone' => '08123456789',
            'status' => 'new',
        ]);

        $this->actingAs($admin)->deleteJson("/api/leads/{$lead->id}")->assertOk();
        $this->assertDatabaseCount('leads', 0);
    }
}
