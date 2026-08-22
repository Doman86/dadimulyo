<?php

namespace Database\Seeders;

use App\Models\TruckCategory;
use Illuminate\Database\Seeder;

class TruckCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Pickup', 'description' => 'Truck ringan untuk angkutan barang skala kecil.'],
            ['name' => 'Truk Bak', 'description' => 'Truck dengan bak terbuka untuk berbagai muatan.'],
            ['name' => 'Truk Box', 'description' => 'Truck dengan box tertutup, aman dari cuaca.'],
            ['name' => 'Truk Wingbox', 'description' => 'Truck box dengan pintu bukaan samping.'],
            ['name' => 'Truk Fuso', 'description' => 'Truck engkel / fuso untuk muatan menengah.'],
            ['name' => 'Truk Tronton', 'description' => 'Truck tronton untuk muatan besar jarak jauh.'],
            ['name' => 'Truk Dump', 'description' => 'Truck dengan bak yang bisa diangkat (dump).'],
            ['name' => 'Cold Storage', 'description' => 'Truck berpendingin untuk produk segar.'],
        ];

        foreach ($categories as $category) {
            TruckCategory::firstOrCreate(['name' => $category['name']], $category);
        }
    }
}
