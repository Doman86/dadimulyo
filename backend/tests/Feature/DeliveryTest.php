<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\Role;
use App\Models\Truck;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryTest extends TestCase
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

    private function order(User $customer): Order
    {
        return Order::create([
            'customer_id' => $customer->id,
            'order_number' => 'DM' . now()->format('Ymd') . '-TEST01',
            'subtotal' => 100000,
            'shipping_cost' => 0,
            'total' => 100000,
            'status' => 'confirmed',
            'payment_status' => 'unpaid',
        ]);
    }

    private function truck(): Truck
    {
        return Truck::create([
            'brand' => 'Hino',
            'model' => 'Dutro 130 HD Box',
            'price' => 465000000,
            'status' => 'available',
            'is_for_sale' => true,
            'is_for_rent' => true,
        ]);
    }

    public function test_admin_can_create_delivery_with_truck_assignment(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $order = $this->order($customer);
        $truck = $this->truck();

        $this->actingAs($admin)
            ->postJson('/api/deliveries', [
                'order_id' => $order->id,
                'truck_id' => $truck->id,
                'pickup_address' => 'Kebun Wagir, Malang',
                'destination_address' => 'Surabaya',
                'shipping_cost' => 350000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.truck.brand', 'Hino')
            ->assertJsonPath('data.order.order_number', $order->order_number);
    }

    public function test_customer_cannot_create_delivery(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $order = $this->order($customer);

        $this->actingAs($customer)
            ->postJson('/api/deliveries', ['order_id' => $order->id])
            ->assertStatus(403);
    }

    public function test_admin_can_update_delivery_status_to_delivered(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $order = $this->order($customer);
        $truck = $this->truck();

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'truck_id' => $truck->id,
            'status' => 'assigned',
            'shipping_cost' => 350000,
        ]);

        $this->actingAs($admin)
            ->putJson("/api/deliveries/{$delivery->id}/status", ['status' => 'delivered'])
            ->assertOk()
            ->assertJsonPath('data.status', 'delivered')
            ->assertJsonPath('data.delivered_at', now()->format('Y-m-d H:i'));
    }

    public function test_customer_can_view_own_delivery(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $order = $this->order($customer);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'status' => 'pending',
            'shipping_cost' => 0,
        ]);

        $this->actingAs($customer)
            ->getJson("/api/deliveries/{$delivery->id}")
            ->assertOk()
            ->assertJsonPath('data.order_id', $order->id);
    }

    public function test_other_customer_cannot_view_delivery(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $other = $this->userWithRole('customer', 'other@test.com');
        $order = $this->order($customer);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'status' => 'pending',
            'shipping_cost' => 0,
        ]);

        $this->actingAs($other)
            ->getJson("/api/deliveries/{$delivery->id}")
            ->assertStatus(403);
    }

    public function test_admin_can_list_deliveries_with_filters(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $order = $this->order($customer);

        Delivery::create(['order_id' => $order->id, 'status' => 'pending', 'shipping_cost' => 0]);
        Delivery::create(['order_id' => $order->id, 'status' => 'delivered', 'shipping_cost' => 0]);

        $this->actingAs($admin)->getJson('/api/deliveries')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($admin)->getJson('/api/deliveries?status=delivered')->assertOk()->assertJsonCount(1, 'data');
    }
}
