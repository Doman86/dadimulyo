<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Truck;
use App\Models\TruckCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class TruckSeeder extends Seeder
{
    public function run(): void
    {
        $sellerRole = Role::where('name', 'truck_seller')->first()?->id;

        $sellerEmail = env('DEMO_SELLER_EMAIL', 'seller@dadimulyo.com');
        $adminEmail = env('DEMO_ADMIN_EMAIL', 'admin@dadimulyo.com');
        $defaultPassword = env('DEMO_DEFAULT_PASSWORD', 'password');

        $seller = User::where('email', $sellerEmail)->first()
            ?? User::create([
                'name' => 'Seller Truck Budi',
                'email' => $sellerEmail,
                'password' => $defaultPassword,
                'role_id' => $sellerRole,
                'status' => 'active',
            ]);

        $admin = User::where('email', $adminEmail)->first();

        $trucks = [
            [
                'category' => 'Truk Box',
                'brand' => 'Hino',
                'model' => 'Dutro 130 HD Box',
                'year' => 2022,
                'price' => 465000000,
                'mileage' => 85000,
                'engine' => 'J05E-TC',
                'transmission' => 'Manual 6 percepatan',
                'fuel_type' => 'Diesel',
                'capacity' => '4 ton',
                'condition' => 'bekas',
                'location' => 'Wagir, Malang',
                'description' => 'Truk box Hino Dutro 130 HD, mesin halus, siap operasional. Box aluminium utuh, kabin nyaman, perawatan rutin di bengkel resmi.',
                'is_for_sale' => true,
                'is_for_rent' => true,
                'rental_price_per_day' => 1500000,
                'specifications' => [
                    ['key' => 'Panjang Box', 'value' => '5,8 m'],
                    ['key' => 'Lebar Box', 'value' => '2,2 m'],
                    ['key' => 'Tinggi Box', 'value' => '2,3 m'],
                    ['key' => 'Jumlah Roda', 'value' => '6'],
                ],
            ],
            [
                'category' => 'Truk Fuso',
                'brand' => 'Mitsubishi',
                'model' => 'Fuso FN 517',
                'year' => 2021,
                'price' => 720000000,
                'mileage' => 145000,
                'engine' => '6D16-T',
                'transmission' => 'Manual 8 percepatan',
                'fuel_type' => 'Diesel',
                'capacity' => '8 ton',
                'condition' => 'bekas',
                'location' => 'Wagir, Malang',
                'description' => 'Fuso FN 517 tenaga besar, cocok untuk angkutan antar kota. Mesin 6D16 terbukti bandel, kaki-kaki masih orisinil.',
                'is_for_sale' => true,
                'is_for_rent' => false,
                'specifications' => [
                    ['key' => 'Panjang Chassis', 'value' => '7,2 m'],
                    ['key' => 'Jumlah Roda', 'value' => '6'],
                    ['key' => 'Tenaga', 'value' => '220 PS'],
                ],
            ],
            [
                'category' => 'Pickup',
                'brand' => 'Daihatsu',
                'model' => 'Grand Max PU',
                'year' => 2023,
                'price' => 185000000,
                'mileage' => 32000,
                'engine' => '1NR-VE 1.5',
                'transmission' => 'Manual 5 percepatan',
                'fuel_type' => 'Bensin',
                'capacity' => '1 ton',
                'condition' => 'bekas',
                'location' => 'Wagir, Malang',
                'description' => 'Pickup Grand Max 2023, masih seperti baru, cocok untuk usaha toko dan antar barang ringan. Pajak panjang.',
                'is_for_sale' => true,
                'is_for_rent' => false,
                'specifications' => [
                    ['key' => 'Panjang Bak', 'value' => '2,6 m'],
                    ['key' => 'Lebar Bak', 'value' => '1,6 m'],
                    ['key' => 'CC', 'value' => '1.495 cc'],
                ],
            ],
            [
                'category' => 'Truk Tronton',
                'brand' => 'Hino',
                'model' => 'Ranger FM 285 JD',
                'year' => 2020,
                'price' => 1100000000,
                'mileage' => 280000,
                'engine' => 'J08E',
                'transmission' => 'Manual 8 percepatan',
                'fuel_type' => 'Diesel',
                'capacity' => '20 ton',
                'condition' => 'bekas',
                'location' => 'Wagir, Malang',
                'description' => 'Tronton Ranger FM 285 untuk angkutan berat jarak jauh. Surat lengkap, siap kerja. Bisa nego untuk cash.',
                'is_for_sale' => true,
                'is_for_rent' => true,
                'rental_price_per_day' => 3500000,
                'specifications' => [
                    ['key' => 'Panjang Chassis', 'value' => '9,5 m'],
                    ['key' => 'Jumlah Roda', 'value' => '10'],
                    ['key' => 'Tenaga', 'value' => '285 PS'],
                ],
            ],
            [
                'category' => 'Cold Storage',
                'brand' => 'Isuzu',
                'model' => 'ELF NMR 71 Cold',
                'year' => 2022,
                'price' => 620000000,
                'mileage' => 60000,
                'engine' => '4HK1-TC',
                'transmission' => 'Manual 6 percepatan',
                'fuel_type' => 'Diesel',
                'capacity' => '3 ton',
                'condition' => 'bekas',
                'location' => 'Wagir, Malang',
                'description' => 'Truk box berpendingin (cold storage) ideal untuk mengangkut jeruk dan produk segar. Mesin pendingin masih prima, suhu stabil -5°C sampai 5°C.',
                'is_for_sale' => true,
                'is_for_rent' => true,
                'rental_price_per_day' => 2500000,
                'specifications' => [
                    ['key' => 'Panjang Box', 'value' => '5,2 m'],
                    ['key' => 'Merk Pendingin', 'value' => 'Nikki'],
                    ['key' => 'Suhu Min.', 'value' => '-5°C'],
                ],
            ],
            [
                'category' => 'Truk Dump',
                'brand' => 'Mitsubishi',
                'model' => 'Colt Diesel FE 73 Dump',
                'year' => 2019,
                'price' => 340000000,
                'mileage' => 210000,
                'engine' => '4D34',
                'transmission' => 'Manual 5 percepatan',
                'fuel_type' => 'Diesel',
                'capacity' => '3 ton',
                'condition' => 'bekas',
                'location' => 'Wagir, Malang',
                'description' => 'Truk dump Colt Diesel FE 73, hidrolik jalan mulus, cocok untuk proyek dan angkut material.',
                'is_for_sale' => true,
                'is_for_rent' => true,
                'rental_price_per_day' => 1200000,
                'specifications' => [
                    ['key' => 'Kapasitas Bak', 'value' => '3 m³'],
                    ['key' => 'Hidrolik', 'value' => 'Normal'],
                ],
            ],
        ];

        foreach ($trucks as $data) {
            $category = TruckCategory::where('name', $data['category'])->first();
            $specs = $data['specifications'];
            unset($data['category'], $data['specifications']);

            $truck = Truck::updateOrCreate(
                ['brand' => $data['brand'], 'model' => $data['model'], 'year' => $data['year']],
                [
                    ...$data,
                    'category_id' => $category?->id,
                    'seller_id' => $seller?->id ?? $admin?->id,
                    'status' => 'available',
                ]
            );

            foreach ($specs as $spec) {
                $truck->specifications()->firstOrCreate($spec);
            }
        }
    }
}
