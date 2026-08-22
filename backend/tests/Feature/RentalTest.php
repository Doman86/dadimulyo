<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Rental;
use App\Models\Truck;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalTest extends TestCase
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

    private function rentableTruck(array $overrides = []): Truck
    {
        return Truck::create([
            'brand' => 'Hino',
            'model' => 'Dutro 130 HD Box',
            'year' => 2022,
            'price' => 465000000,
            'rental_price_per_day' => 1500000,
            'status' => 'available',
            'is_for_sale' => true,
            'is_for_rent' => true,
            ...$overrides,
        ]);
    }

    public function test_customer_can_book_rental_with_correct_price(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $truck = $this->rentableTruck();

        $response = $this->actingAs($customer)->postJson('/api/rentals', [
            'truck_id' => $truck->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
            'notes' => 'Untuk angkut jeruk ke Surabaya.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.price_per_day', 1500000)
            ->assertJsonPath('data.days', 3)
            ->assertJsonPath('data.total_price', 4500000)
            ->assertJsonPath('data.truck.brand', 'Hino');
    }

    public function test_overlapping_booking_is_rejected(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $truck = $this->rentableTruck();

        Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $customer->id,
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'price_per_day' => 1500000,
            'total_price' => 6000000,
            'status' => 'confirmed',
        ]);

        // Overlaps inside the existing booking.
        $this->actingAs($customer)->postJson('/api/rentals', [
            'truck_id' => $truck->id,
            'start_date' => now()->addDays(4)->toDateString(),
            'end_date' => now()->addDays(6)->toDateString(),
        ])->assertStatus(422);

        // Non-overlapping dates are fine.
        $this->actingAs($customer)->postJson('/api/rentals', [
            'truck_id' => $truck->id,
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(12)->toDateString(),
        ])->assertStatus(201);
    }

    public function test_cannot_book_truck_not_for_rent(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $truck = $this->rentableTruck(['is_for_rent' => false]);

        $this->actingAs($customer)->postJson('/api/rentals', [
            'truck_id' => $truck->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ])->assertStatus(422);
    }

    public function test_availability_endpoint(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $truck = $this->rentableTruck();

        Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $customer->id,
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addDays(4)->toDateString(),
            'price_per_day' => 1500000,
            'total_price' => 4500000,
            'status' => 'active',
        ]);

        $this->getJson('/api/trucks/' . $truck->id . '/availability?start_date=' . now()->addDays(3)->toDateString() . '&end_date=' . now()->addDays(5)->toDateString())
            ->assertOk()
            ->assertJsonPath('data.available', false);

        $this->getJson('/api/trucks/' . $truck->id . '/availability?start_date=' . now()->addDays(10)->toDateString() . '&end_date=' . now()->addDays(12)->toDateString())
            ->assertOk()
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.rental_price_per_day', 1500000);
    }

    public function test_customer_sees_only_own_rentals(): void
    {
        $customerA = $this->userWithRole('customer', 'a@test.com');
        $customerB = $this->userWithRole('customer', 'b@test.com');
        $truck = $this->rentableTruck();

        Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $customerA->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'price_per_day' => 1500000,
            'total_price' => 3000000,
            'status' => 'pending',
        ]);

        $this->actingAs($customerB)
            ->getJson('/api/rentals')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($customerA)
            ->getJson('/api/rentals')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_customer_can_cancel_pending_rental(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $truck = $this->rentableTruck();

        $rental = Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $customer->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'price_per_day' => 1500000,
            'total_price' => 3000000,
            'status' => 'pending',
        ]);

        $this->actingAs($customer)
            ->putJson("/api/rentals/{$rental->id}", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_customer_cannot_cancel_completed_rental(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $truck = $this->rentableTruck();

        $rental = Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $customer->id,
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->subDays(3)->toDateString(),
            'price_per_day' => 1500000,
            'total_price' => 4500000,
            'status' => 'completed',
        ]);

        $this->actingAs($customer)
            ->putJson("/api/rentals/{$rental->id}", ['status' => 'cancelled'])
            ->assertStatus(422);
    }

    public function test_admin_can_confirm_rental(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $truck = $this->rentableTruck();

        $rental = Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $customer->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'price_per_day' => 1500000,
            'total_price' => 3000000,
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->putJson("/api/rentals/{$rental->id}", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
    }

    public function test_booking_requires_authentication(): void
    {
        $this->postJson('/api/rentals', [
            'truck_id' => 1,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ])->assertStatus(401);
    }
}
