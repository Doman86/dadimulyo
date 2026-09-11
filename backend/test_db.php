<?php
$pdo = new PDO('mysql:host=localhost;dbname=dadimulyo', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Insert sample products
$products = [
    [
        'name' => 'Jeruk Malang',
        'description' => 'Jeruk segar dari Malang, berkualitas premium',
        'grade' => 'Premium',
        'price_per_kg' => 25000,
        'wholesale_price' => 22000,
        'stock_kg' => 100,
        'minimum_order_kg' => 5,
        'farm_location' => 'Malang, East Java',
        'status' => 'available',
        'harvest_date' => '2024-01-15',
    ],
    [
        'name' => 'Jeruk Premium',
        'description' => 'Jeruk premium pilihan untuk kebutuhan Anda',
        'grade' => 'Premium',
        'price_per_kg' => 35000,
        'wholesale_price' => 30000,
        'stock_kg' => 50,
        'minimum_order_kg' => 3,
        'farm_location' => 'Bandung, West Java',
        'status' => 'available',
        'harvest_date' => '2024-01-20',
    ],
    [
        'name' => 'Jerik Jaffa',
        'description' => 'Jeruk Jaffa dari Brazil, manis dan segar',
        'grade' => 'Medium',
        'price_per_kg' => 18000,
        'wholesale_price' => 15000,
        'stock_kg' => 75,
        'minimum_order_kg' => 5,
        'farm_location' => 'Lampung',
        'status' => 'available',
        'harvest_date' => '2024-02-01',
    ],
];

foreach ($products as $product) {
    $sql = "INSERT INTO orange_products (name, description, grade, price_per_kg, wholesale_price, stock_kg, minimum_order_kg, farm_location, status, harvest_date) VALUES (
        :name, :description, :grade, :price_per_kg, :wholesale_price, :stock_kg, :minimum_order_kg, :farm_location, :status, :harvest_date
    )";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($product);
    echo "Inserted: " . $product['name'] . "\n";
}

echo "Total products: " . $pdo->lastInsertId() . "\n";

// Verify
$stmt = $pdo->query("SELECT * FROM orange_products");
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Products in DB: " . count($results) . "\n";

$pdo = null;
echo "Done!\n";