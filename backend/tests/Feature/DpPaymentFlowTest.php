<?php

namespace Tests\Feature;

use App\Models\OrangeProduct;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DpPaymentFlowTest extends TestCase
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

    private function createDpOrder(): array
    {
        $customer = $this->userWithRole('customer', 'dp-customer@test.com');
        $product = $this->product();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['orange_product_id' => $product->id, 'quantity_kg' => 10]],
            'payment_method' => 'dp_online',
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

    public function test_dp_order_stores_half_amount_and_starts_unpaid(): void
    {
        [, $orderId] = $this->createDpOrder();

        // 10 kg × 18.000 = 180.000 — DP = 90.000.
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'total' => 180000,
            'dp_amount' => 90000,
            'payment_method' => 'dp_online',
            'payment_status' => 'unpaid',
        ]);
    }

    public function test_dp_order_exposes_dp_and_remaining_amount_via_api(): void
    {
        [$customer, $orderId] = $this->createDpOrder();

        $data = $this->actingAs($customer)
            ->getJson("/api/orders/{$orderId}")
            ->assertOk()
            ->json('data');

        $this->assertEquals(90000, $data['dp_amount']);
        $this->assertEquals(90000, $data['remaining_amount']);
        $this->assertSame('unpaid', $data['payment_status']);
    }

    public function test_dp_settlement_webhook_marks_order_paid(): void
    {
        [, $orderId] = $this->createDpOrder();

        // Tahap 1: DP masuk.
        $this->postJson('/api/midtrans/payment-notification', [
            'order_id' => "JERUK-{$orderId}-DP",
            'transaction_status' => 'settlement',
            'transaction_id' => 'tx-dp-1',
            'payment_type' => 'qris',
        ])->assertOk();

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'dp_paid',
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $orderId,
            'amount' => 90000,
            'status' => 'paid',
        ]);

        // Tahap 2: pelunasan masuk.
        $this->postJson('/api/midtrans/payment-notification', [
            'order_id' => "JERUK-{$orderId}-REMAIN",
            'transaction_status' => 'settlement',
            'transaction_id' => 'tx-remain-1',
            'payment_type' => 'qris',
        ])->assertOk();

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'paid',
            'status' => 'confirmed',
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $orderId,
            'amount' => 90000,
            'status' => 'paid',
        ]);
    }

    public function test_dp_settlement_failure_keeps_dp_status(): void
    {
        [, $orderId] = $this->createDpOrder();

        $this->postJson('/api/midtrans/payment-notification', [
            'order_id' => "JERUK-{$orderId}-DP",
            'transaction_status' => 'settlement',
            'transaction_id' => 'tx-dp-2',
            'payment_type' => 'qris',
        ])->assertOk();

        // Snap pelunasan gagal — DP tidak boleh ikut turun ke failed.
        $this->postJson('/api/midtrans/payment-notification', [
            'order_id' => "JERUK-{$orderId}-REMAIN",
            'transaction_status' => 'deny',
            'transaction_id' => 'tx-remain-2',
            'payment_type' => 'qris',
        ])->assertOk();

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'dp_paid',
        ]);
    }

    public function test_admin_can_settle_dp_cash(): void
    {
        $admin = $this->userWithRole('admin', 'dp-admin@test.com');
        [, $orderId] = $this->createDpOrder();

        $this->postJson('/api/midtrans/payment-notification', [
            'order_id' => "JERUK-{$orderId}-DP",
            'transaction_status' => 'settlement',
            'transaction_id' => 'tx-dp-3',
            'payment_type' => 'qris',
        ])->assertOk();

        // Pelunasan tunai dikonfirmasi admin.
        $this->actingAs($admin)
            ->postJson("/api/orders/{$orderId}/payment/confirm")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'paid',
            'payment_method' => 'dp_online',
        ]);
    }
}
