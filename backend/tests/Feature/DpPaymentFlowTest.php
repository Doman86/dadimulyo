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

    /**
     * Webhook Midtrans kini PUBLIC dan memverifikasi signature_key
     * (sha512 dari order_id + status_code + gross_amount + server_key).
     * Helper ini menyusun payload notifikasi lengkap dengan signature valid.
     */
    private function postWebhook(string $midtransOrderId, string $status, array $extra = []): \Illuminate\Testing\TestResponse
    {
        $payload = [
            'order_id' => $midtransOrderId,
            'transaction_status' => $status,
            'transaction_id' => 'tx-' . uniqid(),
            'payment_type' => 'qris',
            'status_code' => '200',
            'gross_amount' => '90000.00',
            ...$extra,
        ];

        $payload['signature_key'] = hash(
            'sha512',
            $payload['order_id'] . $payload['status_code'] . $payload['gross_amount'] . config('services.midtrans.server_key'),
        );

        return $this->postJson('/api/midtrans/payment-notification', $payload);
    }

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
        $this->postWebhook("JERUK-{$orderId}-DP", 'settlement')->assertOk();

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
        $this->postWebhook("JERUK-{$orderId}-REMAIN", 'settlement')->assertOk();

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

        $this->postWebhook("JERUK-{$orderId}-DP", 'settlement')->assertOk();

        // Snap pelunasan gagal — DP tidak boleh ikut turun ke failed.
        $this->postWebhook("JERUK-{$orderId}-REMAIN", 'deny')->assertOk();

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'dp_paid',
        ]);
    }

    public function test_webhook_with_invalid_signature_is_rejected(): void
    {
        [, $orderId] = $this->createDpOrder();

        // Signature palsu (bukan hasil sha512 dengan server key asli).
        $response = $this->postJson('/api/midtrans/payment-notification', [
            'order_id' => "JERUK-{$orderId}-DP",
            'transaction_status' => 'settlement',
            'transaction_id' => 'tx-fake',
            'payment_type' => 'qris',
            'status_code' => '200',
            'gross_amount' => '90000.00',
            'signature_key' => str_repeat('0', 128),
        ]);

        $response->assertStatus(403);

        // Order tidak boleh berubah jadi dp_paid oleh request palsu.
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'unpaid',
        ]);
    }

    public function test_admin_can_settle_dp_cash(): void
    {
        $admin = $this->userWithRole('admin', 'dp-admin@test.com');
        [, $orderId] = $this->createDpOrder();

        $this->postWebhook("JERUK-{$orderId}-DP", 'settlement')->assertOk();

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
