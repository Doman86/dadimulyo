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
                'email' => env('DEMO_ADMIN_EMAIL', 'admin@dadimulyo.com'),
                'role' => 'admin',
            ],
            [
                'name' => 'Sales Andi',
                'email' => env('DEMO_SALES_EMAIL', 'sales@dadimulyo.com'),
                'role' => 'sales',
            ],
            [
                'name' => 'Seller Truck Budi',
                'email' => env('DEMO_SELLER_EMAIL', 'seller@dadimulyo.com'),
                'role' => 'truck_seller',
            ],
            [
                'name' => 'Seller Jeruk Citra',
                'email' => env('DEMO_ORANGE_SELLER_EMAIL', 'orangeseller@dadimulyo.com'),
                'role' => 'orange_seller',
            ],
            [
                'name' => 'Customer Dedi',
                'email' => env('DEMO_CUSTOMER_EMAIL', 'customer@dadimulyo.com'),
                'role' => 'customer',
            ],
        ];

        foreach ($users as $data) {
            $role = Role::where('name', $data['role'])->first();

            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $defaultPhone,
                    'password' => $defaultPassword,
                    'role_id' => $role?->id,
                    'status' => 'active',
                ]
            );
        }
    }
}
