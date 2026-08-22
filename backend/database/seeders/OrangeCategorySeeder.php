<?php

namespace Database\Seeders;

use App\Models\OrangeCategory;
use Illuminate\Database\Seeder;

class OrangeCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Jeruk Keprok', 'description' => 'Jeruk keprok manis, mudah dikupas, khas Malang.'],
            ['name' => 'Jeruk Sunkist', 'description' => 'Jeruk sunkist besar, segar, kaya vitamin C.'],
            ['name' => 'Jeruk Manis', 'description' => 'Jeruk manis untuk konsumsi dan jus.'],
            ['name' => 'Jeruk Purut', 'description' => 'Jeruk purut untuk bumbu masakan.'],
            ['name' => 'Jeruk Lemon', 'description' => 'Lemon segar untuk minuman dan kuliner.'],
        ];

        foreach ($categories as $category) {
            OrangeCategory::firstOrCreate(['name' => $category['name']], $category);
        }
    }
}
