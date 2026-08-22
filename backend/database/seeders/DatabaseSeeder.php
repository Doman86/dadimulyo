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
    }

    private function seedDemoUsers(): void
    {
        $users = [
            ['name' => 'Admin Dadi Mulyo', 'email' => 'admin@dadimulyo.com', 'role' => 'admin'],
            ['name' => 'Sales Andi', 'email' => 'sales@dadimulyo.com', 'role' => 'sales'],
            ['name' => 'Seller Truck Budi', 'email' => 'seller@dadimulyo.com', 'role' => 'truck_seller'],
            ['name' => 'Seller Jeruk Citra', 'email' => 'orangeseller@dadimulyo.com', 'role' => 'orange_seller'],
            ['name' => 'Customer Dedi', 'email' => 'customer@dadimulyo.com', 'role' => 'customer'],
        ];

        foreach ($users as $data) {
            $role = Role::where('name', $data['role'])->first();

            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => '081234567890',
                    'password' => 'password',
                    'role_id' => $role?->id,
                    'status' => 'active',
                ]
            );
        }
    }
}
