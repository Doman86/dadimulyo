<?php

namespace Tests\Feature;

use App\Models\OrangeCategory;
use App\Models\OrangeProduct;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\OrangeCategorySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrangeTest extends TestCase
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

    private function makeProduct(array $overrides = []): OrangeProduct
    {
        return OrangeProduct::create([
            'name' => 'Jeruk Keprok Malang',
            'grade' => 'A',
            'price_per_kg' => 18000,
            'wholesale_price' => 15000,
            'stock_kg' => 2500,
            'minimum_order_kg' => 5,
            'farm_location' => 'Wagir, Malang',
            'status' => 'available',
            ...$overrides,
        ]);
    }

    public function test_public_can_list_orange_products(): void
    {
        $this->seed(OrangeCategorySeeder::class);
        $this->makeProduct(['category_id' => OrangeCategory::first()->id]);

        $this->getJson('/api/oranges')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Jeruk Keprok Malang');
    }

    public function test_public_can_view_product_detail(): void
    {
        $this->seed(OrangeCategorySeeder::class);
        $product = $this->makeProduct(['category_id' => OrangeCategory::first()->id]);

        $this->getJson("/api/oranges/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.price_per_kg', 18000)
            ->assertJsonPath('data.wholesale_price', 15000)
            ->assertJsonPath('data.category.name', OrangeCategory::first()->name);
    }

    public function test_public_can_filter_and_search_products(): void
    {
        $this->makeProduct(['name' => 'Jeruk Keprok Grade A', 'price_per_kg' => 18000]);
        $this->makeProduct(['name' => 'Jeruk Sunkist', 'price_per_kg' => 25000]);
        $this->makeProduct(['name' => 'Jeruk Keprok Grade B', 'price_per_kg' => 14000, 'grade' => 'B']);

        $this->getJson('/api/oranges?search=keprok')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/oranges?grade=A')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/oranges?min_price=15000&max_price=20000')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_customer_cannot_create_product(): void
    {
        $customer = $this->userWithRole('customer', 'customer@test.com');

        $this->actingAs($customer)
            ->postJson('/api/oranges', ['name' => 'Jeruk', 'price_per_kg' => 10000])
            ->assertStatus(403);
    }

    public function test_orange_seller_can_create_product(): void
    {
        $seller = $this->userWithRole('orange_seller', 'seller@test.com');

        $this->actingAs($seller)
            ->postJson('/api/oranges', [
                'name' => 'Jeruk Lemon Segar',
                'grade' => 'A',
                'price_per_kg' => 22000,
                'wholesale_price' => 18000,
                'stock_kg' => 500,
                'minimum_order_kg' => 3,
                'farm_location' => 'Poncokusumo, Malang',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.seller_id', $seller->id)
            ->assertJsonPath('data.price_per_kg', 22000);
    }

    public function test_wholesale_price_cannot_exceed_price_per_kg(): void
    {
        $seller = $this->userWithRole('orange_seller', 'seller@test.com');

        $this->actingAs($seller)
            ->postJson('/api/oranges', [
                'name' => 'Jeruk',
                'price_per_kg' => 10000,
                'wholesale_price' => 15000,
            ])
            ->assertStatus(422);
    }

    public function test_seller_cannot_update_others_product(): void
    {
        $sellerA = $this->userWithRole('orange_seller', 'a@test.com');
        $sellerB = $this->userWithRole('orange_seller', 'b@test.com');
        $product = $this->makeProduct(['seller_id' => $sellerA->id]);

        $this->actingAs($sellerB)
            ->putJson("/api/oranges/{$product->id}", ['price_per_kg' => 20000])
            ->assertStatus(403);
    }

    public function test_seller_can_update_stock(): void
    {
        $seller = $this->userWithRole('orange_seller', 'seller@test.com');
        $product = $this->makeProduct(['seller_id' => $seller->id]);

        $this->actingAs($seller)
            ->putJson("/api/oranges/{$product->id}", ['stock_kg' => 3200])
            ->assertOk()
            ->assertJsonPath('data.stock_kg', 3200);
    }

    public function test_admin_can_delete_product(): void
    {
        $admin = $this->userWithRole('admin', 'admin@test.com');
        $product = $this->makeProduct();

        $this->actingAs($admin)->deleteJson("/api/oranges/{$product->id}")->assertOk();

        $this->assertDatabaseHas('orange_products', ['id' => $product->id, 'status' => 'deleted']);
        $this->getJson("/api/oranges/{$product->id}")->assertStatus(404);
    }

    public function test_upload_and_delete_image(): void
    {
        Storage::fake('public');

        $seller = $this->userWithRole('orange_seller', 'seller@test.com');
        $product = $this->makeProduct(['seller_id' => $seller->id]);

        $response = $this->actingAs($seller)->postJson("/api/oranges/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('jeruk.jpg', 800, 600),
        ]);

        $response->assertStatus(201);

        $image = $product->images()->first();
        $this->assertNotNull($image);
        Storage::disk('public')->assertExists($image->image_path);

        $this->actingAs($seller)
            ->deleteJson("/api/oranges/{$product->id}/images/{$image->id}")
            ->assertOk();

        Storage::disk('public')->assertMissing($image->image_path);
        $this->assertDatabaseCount('orange_images', 0);
    }

    public function test_public_can_get_categories(): void
    {
        $this->seed(OrangeCategorySeeder::class);

        $this->getJson('/api/orange-categories')->assertOk()->assertJsonCount(5, 'data');
    }
}
