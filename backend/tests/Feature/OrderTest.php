<?php

namespace Tests\Feature;

use App\Models\OrangeProduct;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
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

    private function product(array $overrides = []): OrangeProduct
    {
        return OrangeProduct::create([
            'name' => 'Jeruk Keprok Malang',
            'grade' => 'A',
            'price_per_kg' => 18000,
            'wholesale_price' => 15000,
            'stock_kg' => 1000,
            'minimum_order_kg' => 5,
            'farm_location' => 'Wagir, Malang',
            'status' => 'available',
            ...$overrides,
        ]);
    }

    private function orderPayload(int $productId, float $qty): array
    {
        return [
            'items' => [['orange_product_id' => $productId, 'quantity_kg' => $qty]],
            'address' => [
                'recipient_name' => 'Budi',
                'phone' => '08123456789',
                'address' => 'Jl. Merdeka No. 10',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
            ],
        ];
    }

    public function test_customer_can_create_order_with_stock_decrement(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product();

        $response = $this->actingAs($customer)->postJson('/api/orders', $this->orderPayload($product->id, 10));

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.payment_status', 'unpaid')
            ->assertJsonPath('data.subtotal', 180000)
            ->assertJsonPath('data.total', 180000)
            ->assertJsonCount(1, 'data.items');

        $this->assertDatabaseHas('orange_products', ['id' => $product->id, 'stock_kg' => 990]);
        $this->assertDatabaseHas('orders', ['customer_id' => $customer->id, 'status' => 'pending']);
    }

    public function test_bulk_order_uses_wholesale_price(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product();

        $response = $this->actingAs($customer)->postJson('/api/orders', $this->orderPayload($product->id, 100));

        $response->assertStatus(201)
            ->assertJsonPath('data.items.0.price_per_kg', 15000)
            ->assertJsonPath('data.subtotal', 1500000);
    }

    public function test_order_below_minimum_is_rejected(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product(['minimum_order_kg' => 5]);

        $this->actingAs($customer)
            ->postJson('/api/orders', $this->orderPayload($product->id, 2))
            ->assertStatus(422);
    }

    public function test_order_exceeding_stock_is_rejected(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product(['stock_kg' => 50]);

        $this->actingAs($customer)
            ->postJson('/api/orders', $this->orderPayload($product->id, 100))
            ->assertStatus(422);

        $this->assertDatabaseHas('orange_products', ['id' => $product->id, 'stock_kg' => 50]);
    }

    public function test_order_requires_items(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');

        $this->actingAs($customer)->postJson('/api/orders', ['items' => []])->assertStatus(422);
    }

    public function test_customer_sees_only_own_orders(): void
    {
        $customerA = $this->userWithRole('customer', 'a@test.com');
        $customerB = $this->userWithRole('customer', 'b@test.com');
        $product = $this->product();

        $this->actingAs($customerA)->postJson('/api/orders', $this->orderPayload($product->id, 10));

        $this->actingAs($customerB)->getJson('/api/orders')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($customerA)->getJson('/api/orders')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_can_update_order_status_and_payment(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product();

        $orderId = $this->actingAs($customer)
            ->postJson('/api/orders', $this->orderPayload($product->id, 10))
            ->json('data.id');

        $this->actingAs($admin)
            ->putJson("/api/orders/{$orderId}/status", [
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'shipping_cost' => 250000,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.total', 430000);
    }

    public function test_customer_cannot_update_order_status(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product();

        $orderId = $this->actingAs($customer)
            ->postJson('/api/orders', $this->orderPayload($product->id, 10))
            ->json('data.id');

        $this->actingAs($customer)
            ->putJson("/api/orders/{$orderId}/status", ['status' => 'confirmed'])
            ->assertStatus(403);
    }

    public function test_order_with_delivery_creates_delivery_record(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product();

        $payload = $this->orderPayload($product->id, 10);
        $payload['shipping_cost'] = 300000;
        $payload['delivery'] = [
            'scheduled_at' => now()->addDays(2)->toDateString(),
            'notes' => 'Kirim pagi hari.',
        ];

        $response = $this->actingAs($customer)->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.delivery.status', 'pending')
            ->assertJsonPath('data.shipping_cost', 300000)
            ->assertJsonPath('data.total', 480000);

        $this->assertDatabaseHas('deliveries', ['status' => 'pending']);
    }

    public function test_order_requires_authentication(): void
    {
        $this->postJson('/api/orders', ['items' => []])->assertStatus(401);
    }
}
