<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Lead;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrangeProduct;
use App\Models\Rental;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoActivitySeeder extends Seeder
{
    public function run(): void
    {
        $customerEmail = env('DEMO_CUSTOMER_EMAIL', 'customer@dadimulyo.my.id');
        $salesEmail = env('DEMO_SALES_EMAIL', 'sales@dadimulyo.my.id');
        $sellerEmail = env('DEMO_SELLER_EMAIL', 'seller@dadimulyo.my.id');

        $customer = User::where('email', $customerEmail)->first();
        $sales = User::where('email', $salesEmail)->first();
        $truckSeller = User::where('email', $sellerEmail)->first();

        $trucks = Truck::where('is_for_rent', true)->get();
        $rentableTruck = $trucks->first();

        $fruit = OrangeProduct::first();

        $this->seedLeads($sales, $trucks);
        $this->seedRentals($customer, $rentableTruck);
        $this->seedOrders($customer, $fruit);
    }

    private function seedLeads(?User $sales, $trucks): void
    {
        $defaults = [
            'sales_id' => $sales?->id,
            'source' => 'website',
        ];

        $phoneSales = env('DEMO_PHONE_SALES', '081234567811');
        $phoneSeller = env('DEMO_PHONE_SELLER_TRUCK', '081234567822');
        $phoneOrange = env('DEMO_PHONE_SELLER_ORANGE', '081234567833');
        $phoneCustomer = env('DEMO_PHONE_CUSTOMER', '081234567844');

        $leads = [
            [
                ...$defaults,
                'name' => 'Pak Hendra',
                'phone' => $phoneSales,
                'message' => 'Mau tanya sewa tronton untuk angkut jeruk ke Surabaya selama seminggu.',
                'status' => 'new',
                'truck_id' => $trucks->where('brand', 'Hino')->first()?->id,
            ],
            [
                ...$defaults,
                'name' => 'Bu Retno',
                'phone' => $phoneSeller,
                'message' => 'Berminat beli truk box Hino, apakah masih bisa nego?',
                'status' => 'contacted',
                'truck_id' => $trucks->where('brand', 'Hino')->first()?->id,
            ],
            [
                ...$defaults,
                'name' => 'Bapak Samsul',
                'phone' => $phoneOrange,
                'message' => 'Butuh 2 unit dump truck untuk proyek, minta info harga sewa bulanan.',
                'status' => 'negotiating',
                'truck_id' => $trucks->where('brand', 'Mitsubishi')->first()?->id,
            ],
            [
                ...$defaults,
                'name' => 'Ibu Laila',
                'phone' => $phoneCustomer,
                'message' => 'Inquiry umum tentang produk jeruk keprok grosir.',
                'status' => 'new',
            ],
        ];

        foreach ($leads as $data) {
            Lead::updateOrCreate(
                ['name' => $data['name'], 'phone' => $data['phone']],
                $data
            );
        }
    }

    private function seedRentals(?User $customer, ?Truck $truck): void
    {
        if (! $customer || ! $truck) {
            return;
        }

        $rentals = [
            [
                'truck_id' => $truck->id,
                'customer_id' => $customer->id,
                'start_date' => now()->subDays(20)->toDateString(),
                'end_date' => now()->subDays(17)->toDateString(),
                'price_per_day' => $truck->rental_price_per_day ?? 1500000,
                'total_price' => ($truck->rental_price_per_day ?? 1500000) * 4,
                'status' => 'completed',
                'notes' => 'Rental 4 hari untuk angkut hasil panen jeruk.',
            ],
            [
                'truck_id' => $truck->id,
                'customer_id' => $customer->id,
                'start_date' => now()->addDays(3)->toDateString(),
                'end_date' => now()->addDays(7)->toDateString(),
                'price_per_day' => $truck->rental_price_per_day ?? 1500000,
                'total_price' => ($truck->rental_price_per_day ?? 1500000) * 5,
                'status' => 'pending',
                'notes' => 'Direkomendasikan oleh sales Andi untuk pengiriman minggu depan.',
            ],
        ];

        foreach ($rentals as $data) {
            Rental::updateOrCreate(
                [
                    'customer_id' => $data['customer_id'],
                    'truck_id' => $data['truck_id'],
                    'start_date' => $data['start_date'],
                ],
                $data
            );
        }
    }

    private function seedOrders(?User $customer, ?OrangeProduct $fruit): void
    {
        if (! $customer || ! $fruit) {
            return;
        }

        $address = Address::updateOrCreate(
            ['user_id' => $customer->id, 'address' => 'Jl. Merdeka No. 12'],
            [
                'label' => 'Alamat utama',
                'recipient_name' => $customer->name,
                'phone' => $customer->phone,
                'address' => 'Jl. Merdeka No. 12',
                'village' => 'Penanggungan',
                'district' => 'Wagir',
                'city' => 'Malang',
                'province' => 'Jawa Timur',
                'postal_code' => '65158',
            ]
        );

        $orders = [
            [
                'order_number' => 'DM' . now()->subDays(10)->format('Ymd') . '-' . strtoupper(Str::random(6)),
                'status' => 'completed',
                'payment_status' => 'paid',
                'shipping_cost' => 50000,
                'item' => ['quantity_kg' => 60, 'price_per_kg' => $fruit->wholesale_price ?? $fruit->price_per_kg],
            ],
            [
                'order_number' => 'DM' . now()->subDays(2)->format('Ymd') . '-' . strtoupper(Str::random(6)),
                'status' => 'confirmed',
                'payment_status' => 'unpaid',
                'shipping_cost' => 50000,
                'item' => ['quantity_kg' => 25, 'price_per_kg' => $fruit->price_per_kg],
            ],
        ];

        foreach ($orders as $i => $data) {
            $item = $data['item'];
            unset($data['item']);

            $subtotal = $item['quantity_kg'] * $item['price_per_kg'];
            $data['customer_id'] = $customer->id;
            $data['subtotal'] = $subtotal;
            $data['total'] = $subtotal + $data['shipping_cost'];
            $data['shipping_address_id'] = $address->id;

            $order = Order::updateOrCreate(
                ['order_number' => $data['order_number']],
                $data
            );

            OrderItem::updateOrCreate(
                [
                    'order_id' => $order->id,
                    'orange_product_id' => $fruit->id,
                ],
                [
                    'quantity_kg' => $item['quantity_kg'],
                    'price_per_kg' => $item['price_per_kg'],
                    'subtotal' => $subtotal,
                ]
            );

            Notification::firstOrCreate(
                ['user_id' => $customer->id, 'title' => 'Pesanan dibuat'],
                ['message' => "Pesanan {$order->order_number} berhasil dibuat.", 'type' => 'order']
            );
        }
    }
}