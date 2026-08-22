<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Truck;
use App\Models\TruckCategory;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\TruckCategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TruckTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleSeeder::class);

        return User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => 'password123',
            'role_id' => Role::where('name', 'admin')->first()->id,
            'status' => 'active',
        ]);
    }

    private function customer(): User
    {
        $this->seed(RoleSeeder::class);

        return User::create([
            'name' => 'Customer',
            'email' => 'customer@test.com',
            'password' => 'password123',
            'role_id' => Role::where('name', 'customer')->first()->id,
            'status' => 'active',
        ]);
    }

    private function makeTruck(array $overrides = []): Truck
    {
        return Truck::create([
            'brand' => 'Hino',
            'model' => 'Dutro 130',
            'year' => 2022,
            'price' => 450000000,
            'mileage' => 120000,
            'engine' => 'J05E',
            'transmission' => 'Manual',
            'fuel_type' => 'Diesel',
            'capacity' => '5 ton',
            'condition' => 'bekas',
            'description' => 'Truck dalam kondisi baik.',
            'location' => 'Malang',
            'status' => 'available',
            'is_for_sale' => true,
            'is_for_rent' => false,
            ...$overrides,
        ]);
    }

    public function test_public_can_list_trucks(): void
    {
        $this->seed(TruckCategorySeeder::class);
        $this->makeTruck();

        $this->getJson('/api/trucks')
            ->assertOk()
            ->assertJsonPath('data.0.brand', 'Hino');
    }

    public function test_public_can_view_truck_detail_with_relations(): void
    {
        $this->seed(TruckCategorySeeder::class);
        $truck = $this->makeTruck(['category_id' => TruckCategory::first()->id]);
        $truck->specifications()->create(['key' => 'Panjang Bak', 'value' => '4.2 m']);

        $this->getJson("/api/trucks/{$truck->id}")
            ->assertOk()
            ->assertJsonPath('data.brand', 'Hino')
            ->assertJsonPath('data.category.name', TruckCategory::first()->name)
            ->assertJsonCount(1, 'data.specifications');
    }

    public function test_unauthenticated_cannot_create_truck(): void
    {
        $this->postJson('/api/trucks', [
            'brand' => 'Hino',
            'model' => 'Dutro',
            'price' => 100,
        ])->assertStatus(401);
    }

    public function test_customer_cannot_create_truck(): void
    {
        $customer = $this->customer();

        $this->actingAs($customer)
            ->postJson('/api/trucks', [
                'brand' => 'Hino',
                'model' => 'Dutro',
                'price' => 100,
            ])->assertStatus(403);
    }

    public function test_admin_can_create_truck_with_specifications(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson('/api/trucks', [
            'brand' => 'Isuzu',
            'model' => 'ELF NMR',
            'year' => 2021,
            'price' => 320000000,
            'transmission' => 'Manual',
            'is_for_sale' => true,
            'specifications' => [
                ['key' => 'Panjang Bak', 'value' => '4.2 m'],
                ['key' => 'Kapasitas', 'value' => '3 ton'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.brand', 'Isuzu')
            ->assertJsonCount(2, 'data.specifications');

        $this->assertDatabaseHas('trucks', ['brand' => 'Isuzu', 'seller_id' => $admin->id]);
    }

    public function test_admin_can_update_truck(): void
    {
        $admin = $this->admin();
        $truck = $this->makeTruck();

        $this->actingAs($admin)
            ->putJson("/api/trucks/{$truck->id}", [
                'brand' => 'Hino',
                'model' => 'Dutro 150 HD',
                'price' => 480000000,
            ])
            ->assertOk()
            ->assertJsonPath('data.model', 'Dutro 150 HD');
    }

    public function test_admin_can_delete_truck(): void
    {
        $admin = $this->admin();
        $truck = $this->makeTruck();

        $this->actingAs($admin)->deleteJson("/api/trucks/{$truck->id}")->assertOk();

        $this->assertDatabaseHas('trucks', ['id' => $truck->id, 'status' => 'deleted']);
        $this->getJson("/api/trucks/{$truck->id}")->assertStatus(404);
    }

    public function test_search_and_filter_trucks(): void
    {
        $this->seed(TruckCategorySeeder::class);

        $this->makeTruck(['brand' => 'Hino', 'model' => 'Dutro 130', 'price' => 450000000]);
        $this->makeTruck(['brand' => 'Mitsubishi', 'model' => 'Fuso FN', 'price' => 650000000]);
        $this->makeTruck(['brand' => 'Hino', 'model' => 'Ranger FM', 'price' => 800000000]);

        $this->getJson('/api/trucks?search=hino')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/trucks?min_price=500000000&max_price=900000000&sort=price_asc')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.brand', 'Mitsubishi');

        $this->getJson('/api/trucks?search=tidakada')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_upload_and_delete_truck_image(): void
    {
        Storage::fake('public');

        $admin = $this->admin();
        $truck = $this->makeTruck();

        $response = $this->actingAs($admin)->postJson("/api/trucks/{$truck->id}/images", [
            'image' => UploadedFile::fake()->image('truck.jpg', 800, 600),
        ]);

        $response->assertStatus(201);

        $image = $truck->images()->first();
        $this->assertNotNull($image);

        Storage::disk('public')->assertExists($image->image_path);

        $this->actingAs($admin)
            ->deleteJson("/api/trucks/{$truck->id}/images/{$image->id}")
            ->assertOk();

        Storage::disk('public')->assertMissing($image->image_path);
        $this->assertDatabaseCount('truck_images', 0);
    }

    public function test_wishlist_toggle_and_my_wishlist(): void
    {
        $customer = $this->customer();
        $truck = $this->makeTruck();

        $this->actingAs($customer)
            ->postJson("/api/trucks/{$truck->id}/wishlist")
            ->assertOk()
            ->assertJsonPath('data.wishlisted', true);

        $this->actingAs($customer)
            ->getJson('/api/wishlists')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($customer)
            ->postJson("/api/trucks/{$truck->id}/wishlist")
            ->assertOk()
            ->assertJsonPath('data.wishlisted', false);

        $this->actingAs($customer)
            ->getJson('/api/wishlists')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_public_can_get_categories(): void
    {
        $this->seed(TruckCategorySeeder::class);

        $this->getJson('/api/truck-categories')
            ->assertOk()
            ->assertJsonCount(8, 'data');
    }
}
