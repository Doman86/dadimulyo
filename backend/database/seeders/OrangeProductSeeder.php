<?php

namespace Database\Seeders;

use App\Models\OrangeCategory;
use App\Models\OrangeProduct;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrangeProductSeeder extends Seeder
{
    public function run(): void
    {
        $sellerEmail = env('DEMO_ORANGE_SELLER_EMAIL', 'orangeseller@dadimulyo.my.id');
        $defaultPassword = env('DEMO_DEFAULT_PASSWORD', 'password');

        $seller = User::where('email', $sellerEmail)->first()
            ?? User::create([
                'name' => 'Seller Jeruk Citra',
                'email' => $sellerEmail,
                'password' => $defaultPassword,
                'role_id' => Role::where('name', 'orange_seller')->first()?->id,
                'status' => 'active',
            ]);

        $products = [
            [
                'category' => 'Jeruk Keprok',
                'name' => 'Jeruk Keprok Malang Grade A',
                'description' => 'Jeruk keprok Malang kualitas premium, ukuran besar dan seragam, manis merata. Dipanen pagi hari langsung dari kebun Wagir, Malang.',
                'grade' => 'A',
                'price_per_kg' => 18000,
                'wholesale_price' => 15000,
                'stock_kg' => 2500,
                'minimum_order_kg' => 5,
                'harvest_date' => now()->addDays(7)->toDateString(),
                'farm_location' => 'Wagir, Malang',
            ],
            [
                'category' => 'Jeruk Keprok',
                'name' => 'Jeruk Keprok Malang Grade B',
                'description' => 'Jeruk keprok kualitas baik dengan ukuran sedang, cocok untuk pasar dan grosir.',
                'grade' => 'B',
                'price_per_kg' => 14000,
                'wholesale_price' => 11500,
                'stock_kg' => 4000,
                'minimum_order_kg' => 10,
                'harvest_date' => now()->addDays(10)->toDateString(),
                'farm_location' => 'Wagir, Malang',
            ],
            [
                'category' => 'Jeruk Sunkist',
                'name' => 'Jeruk Sunkist Segar',
                'description' => 'Jeruk sunkist besar dan segar, kaya vitamin C, cocok untuk jus dan konsumsi keluarga.',
                'grade' => 'A',
                'price_per_kg' => 25000,
                'wholesale_price' => 21000,
                'stock_kg' => 800,
                'minimum_order_kg' => 3,
                'harvest_date' => now()->addDays(5)->toDateString(),
                'farm_location' => 'Poncokusumo, Malang',
            ],
            [
                'category' => 'Jeruk Manis',
                'name' => 'Jeruk Manis Lokal',
                'description' => 'Jeruk manis lokal dengan rasa manis alami, dijual per kilogram.',
                'grade' => 'A',
                'price_per_kg' => 16000,
                'wholesale_price' => 13000,
                'stock_kg' => 1500,
                'minimum_order_kg' => 5,
                'harvest_date' => now()->addDays(12)->toDateString(),
                'farm_location' => 'Tumpang, Malang',
            ],
            [
                'category' => 'Jeruk Purut',
                'name' => 'Jeruk Purut Segar',
                'description' => 'Jeruk purut untuk bumbu dapur dan masakan, dipetik segar.',
                'grade' => 'A',
                'price_per_kg' => 20000,
                'wholesale_price' => 17000,
                'stock_kg' => 600,
                'minimum_order_kg' => 2,
                'harvest_date' => now()->addDays(3)->toDateString(),
                'farm_location' => 'Wagir, Malang',
            ],
        ];

        foreach ($products as $data) {
            $category = OrangeCategory::where('name', $data['category'])->first();
            unset($data['category']);

            OrangeProduct::updateOrCreate(
                ['name' => $data['name']],
                [
                    ...$data,
                    'category_id' => $category?->id,
                    'seller_id' => $seller->id,
                    'status' => 'available',
                ]
            );
        }
    }
}
