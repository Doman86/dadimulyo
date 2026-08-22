<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\OrangeProduct;
use App\Models\Order;
use App\Models\Rental;
use App\Models\Role;
use App\Models\Truck;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    private function makeTruck(User $seller): Truck
    {
        return Truck::create([
            'seller_id' => $seller->id,
            'brand' => 'Hino',
            'model' => 'Dutro 130',
            'price' => 450000000,
            'rental_price_per_day' => 1500000,
            'status' => 'available',
            'is_for_sale' => true,
            'is_for_rent' => true,
        ]);
    }

    private function makeOrange(User $seller): OrangeProduct
    {
        return OrangeProduct::create([
            'seller_id' => $seller->id,
            'name' => 'Jeruk Keprok Malang',
            'grade' => 'A',
            'price_per_kg' => 18000,
            'stock_kg' => 500,
            'minimum_order_kg' => 5,
            'status' => 'available',
        ]);
    }

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/dashboard')->assertStatus(401);
    }

    public function test_admin_sees_business_summary_and_recent_items(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $seller = $this->userWithRole('truck_seller', 'seller@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');

        $truck = $this->makeTruck($seller);
        $this->makeOrange($seller);

        Lead::create([
            'customer_id' => $customer->id,
            'truck_id' => $truck->id,
            'name' => 'Budi',
            'phone' => '08123456789',
            'status' => 'new',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.summary.trucks_total', 1)
            ->assertJsonPath('data.summary.leads_total', 1)
            ->assertJsonPath('data.summary.users_total', 3)
            ->assertJsonCount(1, 'data.recent_leads');
    }

    public function test_sales_sees_lead_stats_only_for_their_pool(): void
    {
        $sales = $this->userWithRole('sales', 'sales@test.com');
        $otherSales = $this->userWithRole('sales', 'other@test.com');
        $truck = $this->makeTruck($sales);

        Lead::create(['name' => 'A', 'phone' => '1', 'status' => 'new', 'sales_id' => $sales->id, 'truck_id' => $truck->id]);
        Lead::create(['name' => 'B', 'phone' => '2', 'status' => 'contacted', 'sales_id' => null, 'truck_id' => $truck->id]);
        Lead::create(['name' => 'C', 'phone' => '3', 'status' => 'won', 'sales_id' => $otherSales->id, 'truck_id' => $truck->id]);

        $this->actingAs($sales)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.summary.leads_total', 2)
            ->assertJsonPath('data.summary.leads_new', 1)
            ->assertJsonPath('data.summary.leads_contacted', 1)
            ->assertJsonPath('data.summary.leads_won', 0);
    }

    public function test_customer_sees_own_orders_rentals_and_wishlist(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $seller = $this->userWithRole('truck_seller', 'seller@test.com');
        $truck = $this->makeTruck($seller);

        Rental::create([
            'truck_id' => $truck->id,
            'customer_id' => $customer->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'price_per_day' => 1500000,
            'total_price' => 4500000,
            'status' => 'pending',
        ]);

        $customer->wishlists()->create(['truck_id' => $truck->id]);

        $response = $this->actingAs($customer)->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.summary.rentals_total', 1)
            ->assertJsonPath('data.summary.rentals_active', 1)
            ->assertJsonPath('data.summary.wishlist_total', 1)
            ->assertJsonCount(1, 'data.recent_rentals')
            ->assertJsonCount(1, 'data.recent_wishlists');
    }

    public function test_truck_seller_sees_own_trucks_and_leads(): void
    {
        $seller = $this->userWithRole('truck_seller', 'seller@test.com');
        $other = $this->userWithRole('truck_seller', 'other@test.com');

        $myTruck = $this->makeTruck($seller);
        $otherTruck = $this->makeTruck($other);

        Lead::create(['name' => 'A', 'phone' => '1', 'status' => 'new', 'truck_id' => $myTruck->id]);
        Lead::create(['name' => 'B', 'phone' => '2', 'status' => 'new', 'truck_id' => $otherTruck->id]);

        $this->actingAs($seller)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.summary.trucks_total', 1)
            ->assertJsonPath('data.summary.leads_total', 1)
            ->assertJsonCount(1, 'data.recent_trucks');
    }

    public function test_orange_seller_sees_products_and_stock(): void
    {
        $seller = $this->userWithRole('orange_seller', 'seller@test.com');
        $this->makeOrange($seller);

        $this->actingAs($seller)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.summary.oranges_total', 1)
            ->assertJsonPath('data.summary.stock_total_kg', 500)
            ->assertJsonCount(1, 'data.recent_products');
    }

    public function test_revenue_counts_only_paid_orders(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');

        Order::create([
            'customer_id' => $customer->id,
            'order_number' => 'DM20260817-AAAAAA',
            'subtotal' => 100000,
            'shipping_cost' => 0,
            'total' => 100000,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        Order::create([
            'customer_id' => $customer->id,
            'order_number' => 'DM20260817-BBBBBB',
            'subtotal' => 200000,
            'shipping_cost' => 0,
            'total' => 200000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.summary.orders_total', 2)
            ->assertJsonPath('data.summary.revenue', 100000);
    }
}
