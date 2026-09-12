<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(TruckCategorySeeder::class);
        $this->call(TruckSeeder::class);
        $this->call(OrangeCategorySeeder::class);
        $this->call(OrangeProductSeeder::class);

        $this->seedDemoUsers();

        $this->call(DemoActivitySeeder::class);
    }

    private function seedDemoUsers(): void
    {
        $defaultPassword = env('DEMO_DEFAULT_PASSWORD', 'password');
        $defaultPhone = env('DEMO_DEFAULT_PHONE', '081234567890');

        $users = [
            [
                'name' => 'Admin Dadi Mulyo',
                'email' => env('DEMO_ADMIN_EMAIL', 'admin@dadimulyo.my.id'),
                'role' => 'admin',
                'phone' => env('DEMO_PHONE_ADMIN', '081234567890'),
            ],
            [
                'name' => 'Sales Andi',
                'email' => env('DEMO_SALES_EMAIL', 'sales@dadimulyo.my.id'),
                'role' => 'sales',
                'phone' => env('DEMO_PHONE_SALES', '081234567811'),
            ],
            [
                'name' => 'Seller Truck Budi',
                'email' => env('DEMO_SELLER_EMAIL', 'seller@dadimulyo.my.id'),
                'role' => 'truck_seller',
                'phone' => env('DEMO_PHONE_SELLER_TRUCK', '081234567822'),
            ],
            [
                'name' => 'Seller Jeruk Citra',
                'email' => env('DEMO_ORANGE_SELLER_EMAIL', 'orangeseller@dadimulyo.my.id'),
                'role' => 'orange_seller',
                'phone' => env('DEMO_PHONE_SELLER_ORANGE', '081234567833'),
            ],
            [
                'name' => 'Customer Dedi',
                'email' => env('DEMO_CUSTOMER_EMAIL', 'customer@dadimulyo.my.id'),
                'role' => 'customer',
                'phone' => env('DEMO_PHONE_CUSTOMER', '081234567844'),
            ],
        ];

        foreach ($users as $data) {
            $role = Role::where('name', $data['role'])->first();

            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'] ?? $defaultPhone,
                    'password' => $defaultPassword,
                    'role_id' => $role?->id,
                    'status' => 'active',
                ]
            );
        }
    }
}
