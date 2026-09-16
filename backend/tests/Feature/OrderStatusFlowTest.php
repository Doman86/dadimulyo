<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\OrangeProduct;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStatusFlowTest extends TestCase
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

    private function product(): OrangeProduct
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
        ]);
    }

    private function createOrder(string $paymentMethod): array
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');
        $product = $this->product();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['orange_product_id' => $product->id, 'quantity_kg' => 10]],
            'payment_method' => $paymentMethod,
            'address' => [
                'recipient_name' => 'Budi',
                'phone' => '08123456789',
                'address' => 'Jl. Merdeka No. 10',
                'city' => 'Surabaya',
            ],
        ]);

        $response->assertStatus(201);

        return [$customer, $response->json('data.id')];
    }

    public function test_checkout_persists_payment_method_and_starts_pending_unpaid(): void
    {
        [$customer, $orderId] = $this->createOrder('cod');

        $this->actingAs($customer)
            ->getJson("/api/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.payment_status', 'unpaid')
            ->assertJsonPath('data.payment_method', 'cod');

        $this->assertDatabaseHas('orders', ['id' => $orderId, 'payment_method' => 'cod']);
    }

    public function test_admin_cannot_jump_status_flow(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        [, $orderId] = $this->createOrder('online');

        // pending -> completed harus ditolak; harus lewat confirmed/processing/dll.
        $this->actingAs($admin)
            ->putJson("/api/orders/{$orderId}/status", ['status' => 'completed'])
            ->assertStatus(422);
    }

    public function test_cash_confirmation_sets_paid_without_completing_order(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        [, $orderId] = $this->createOrder('face_to_face');

        // Pembayaran tunai dikonfirmasi...
        $this->actingAs($admin)
            ->postJson("/api/orders/{$orderId}/payment/confirm")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        // ...tetapi order TIDAK otomatis completed.
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'paid',
            'status' => 'pending',
        ]);

        // Payment record ikut terverifikasi.
        $this->assertDatabaseHas('payments', ['order_id' => $orderId, 'status' => 'paid']);
    }

    public function test_delivery_progress_syncs_order_status(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        [, $orderId] = $this->createOrder('cod');

        $delivery = Delivery::create([
            'order_id' => $orderId,
            'pickup_address' => 'Kebun Dadi Mulyo',
            'destination_address' => 'Surabaya',
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->putJson("/api/deliveries/{$delivery->id}/status", ['status' => 'in_transit'])
            ->assertOk();

        $this->assertDatabaseHas('orders', ['id' => $orderId, 'status' => 'shipping']);

        $this->actingAs($admin)
            ->putJson("/api/deliveries/{$delivery->id}/status", ['status' => 'delivered'])
            ->assertOk();

        // COD: barang diterima, order delivered, pembayaran BELUM otomatis paid.
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'delivered',
            'payment_status' => 'unpaid',
        ]);
    }
}
