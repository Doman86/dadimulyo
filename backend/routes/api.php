<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\OrangeCategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrangeProductController;
use App\Http\Controllers\Api\RentalController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SiteStatsController;
use App\Http\Controllers\Api\TruckCategoryController;
use App\Http\Controllers\Api\TruckController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\MidtransNotificationController;
use App\Http\Controllers\Api\TruckOrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DownloadController;

// Authentication
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:60,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:60,1');
Route::post('/login/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:60,1');
Route::post('/login/resend', [AuthController::class, 'resendOtp'])->middleware('throttle:60,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:10,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');

// Chatbot
Route::get('/chatbot/welcome', function () {
    return response()->json([
        'success' => true,
        'message' => 'Halo 👋 Selamat datang di Dadi Mulyo! Ada yang bisa saya bantu? Ketik "menu" untuk melihat menu.',
    ]);
});

Route::get('/chatbot/menu', function () {
    return response()->json([
        'success' => true,
        'menu' => [
            ['id' => 1, 'label' => 'Produk', 'description' => 'Lihat daftar produk jeruk'],
            ['id' => 2, 'label' => 'Harga', 'description' => 'Cek harga produk'],
            ['id' => 3, 'label' => 'Pesanan', 'description' => 'Cari pesanan saya'],
            ['id' => 4, 'label' => 'Bantuan', 'description' => 'Panduan penggunaan'],
            ['id' => 5, 'label' => 'Admin', 'description' => 'Kontak admin'],
        ],
    ]);
});

Route::get('/chatbot/products', function (Request $request) {
    try {
        $perPage = $request->input('per_page', 5);
        $products = App\Models\OrangeProduct::where('status', '!=', 'deleted')
            ->take($perPage)
            ->get([
                'id',
                'name',
                'price_per_kg',
                'stock_kg',
                'farm_location',
            ]);

        return response()->json([
            'success' => true,
            'products' => $products->toArray(),
            'total' => $products->count(),
        ]);
    } catch (\Exception $e) {
        \Log::error('Chatbot products error: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan saat mengambil data produk',
        ], 500);
    }
});

Route::get('/chatbot/product/{name}', function ($name) {
    $product = App\Models\OrangeProduct::where('name', 'like', "%{$name}%")
        ->where('status', '!=', 'deleted')
        ->first();

    if (!$product) {
        return response()->json([
            'success' => false,
            'message' => 'Produk tidak ditemukan',
        ], 404);
    }

    return response()->json([
        'success' => true,
        'product' => [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'price_per_kg' => $product->price_per_kg,
            'wholesale_price' => $product->wholesale_price,
            'stock_kg' => $product->stock_kg,
            'minimum_order_kg' => $product->minimum_order_kg,
            'grade' => $product->grade,
            'farm_location' => $product->farm_location,
            'status' => $product->status,
        ],
    ]);
});

Route::get('/chatbot/user/{whatsapp}', function ($whatsapp) {
    $digits = preg_replace('/\D+/', '', $whatsapp);

    if (str_starts_with($digits, '62')) {
        $normalized = $digits;
        $local = '0' . substr($digits, 2);
    } else {
        $local = '0' . ltrim($digits, '0');
        $normalized = '62' . ltrim($digits, '0');
    }

    $user = App\Models\User::where('phone', $whatsapp)->first()
        ?? App\Models\User::where('phone', $local)->first()
        ?? App\Models\User::where('phone', $normalized)->first();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Nomor WhatsApp belum terdaftar di sistem Dadi Mulyo.',
        ], 404);
    }

    return response()->json([
        'success' => true,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
        ],
    ]);
});

Route::get('/chatbot/order/{userId}', function ($userId) {
    $order = App\Models\Order::where('customer_id', $userId)
        ->latest('created_at')
        ->first();

    if (!$order) {
        return response()->json([
            'success' => false,
            'message' => 'Anda belum memiliki pesanan.',
        ]);
    }

    return response()->json([
        'success' => true,
        'order' => $order,
    ]);
});

// Named login route
Route::get('/login', fn () => response()->json([
    'success' => false,
    'message' => 'Unauthenticated.',
], 401))->name('login');

// Public: trucks
Route::get('/trucks', [TruckController::class, 'index']);
Route::get('/trucks/{truck}', [TruckController::class, 'show']);
Route::get('/truck-categories', [TruckCategoryController::class, 'index']);

// Public: oranges
Route::get('/oranges', [OrangeProductController::class, 'index']);
Route::get('/oranges/{orange}', [OrangeProductController::class, 'show']);
Route::get('/orange-categories', [OrangeCategoryController::class, 'index']);

// Public: leads
Route::post('/leads', [LeadController::class, 'store']);

// Public: rental availability
Route::get('/trucks/{truck}/availability', [RentalController::class, 'availability']);
Route::get('/trucks/{truck}/availability/calendar', [RentalController::class, 'calendar']);

// Public: reviews
Route::get('/reviews', [ReviewController::class, 'index']);

// Public: landing page stats
Route::get('/site-stats', [SiteStatsController::class, 'index']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Profil (mobile: edit profil & ganti password)
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'changePassword']);

    // Alamat tersimpan (mobile)
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
    Route::put('/addresses/{address}/default', [AddressController::class, 'setDefault']);

    // FCM device token
    Route::post('/fcm-token', [DeviceTokenController::class, 'store']);
    Route::delete('/fcm-token', [DeviceTokenController::class, 'destroy']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
    Route::post('/reviews/{review}/reply', [ReviewController::class, 'reply']);

    // Payments — jeruk (order)
    Route::post('/orders/{order}/payment', [PaymentController::class, 'store']);
    Route::delete('/orders/{order}/payment/{payment}', [PaymentController::class, 'destroy']);
    Route::post('/orders/{order}/midtrans', [PaymentController::class, 'createMidtransTransaction']);

    // Payments — sewa truck (rental)
    Route::post('/rentals/{rental}/payment', [PaymentController::class, 'storeRentalPayment']);
    Route::delete('/rentals/{rental}/payment/{payment}', [PaymentController::class, 'destroyRentalPayment']);
    Route::post('/rentals/{rental}/midtrans', [PaymentController::class, 'createRentalMidtrans']);

    // Payments — beli truck (truck order)
    Route::post('/truck-orders', [TruckOrderController::class, 'store']);
    Route::get('/truck-orders', [TruckOrderController::class, 'index']);
    Route::get('/truck-orders/{truck_order}', [TruckOrderController::class, 'show']);
    Route::put('/truck-orders/{truck_order}/cancel', [TruckOrderController::class, 'cancel']);
    Route::put('/truck-orders/{truck_order}/status', [TruckOrderController::class, 'updateStatus']);
    Route::post('/truck-orders/{truck_order}/payment', [PaymentController::class, 'storeTruckOrderPayment']);
    Route::delete('/truck-orders/{truck_order}/payment/{payment}', [PaymentController::class, 'destroyTruckOrderPayment']);
    Route::post('/truck-orders/{truck_order}/midtrans', [PaymentController::class, 'createTruckOrderMidtrans']);

    // Midtrans Notification Endpoints
    Route::post('/midtrans/payment-notification', [MidtransNotificationController::class, 'handlePaymentNotification']);
    Route::post('/midtrans/recurring-notification', [MidtransNotificationController::class, 'handleRecurringNotification']);
    Route::post('/midtrans/gopay-linking', [MidtransNotificationController::class, 'handleGoPayLinking']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'read']);
    Route::put('/notifications/read-all', [NotificationController::class, 'readAll']);

    // Validasi stok keranjang sebelum checkout (mobile)
    Route::post('/cart/validate', [OrderController::class, 'validateCart']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'stats']);

    // Trucks
    Route::post('/trucks', [TruckController::class, 'store']);
    Route::put('/trucks/{truck}', [TruckController::class, 'update']);
    Route::delete('/trucks/{truck}', [TruckController::class, 'destroy']);
    Route::post('/trucks/{truck}/images', [TruckController::class, 'uploadImage']);
    Route::delete('/trucks/{truck}/images/{image}', [TruckController::class, 'deleteImage']);

    // Wishlist
    Route::get('/wishlists', [TruckController::class, 'myWishlist']);
    Route::post('/trucks/{truck}/wishlist', [TruckController::class, 'toggleWishlist']);

    // Truck categories
    Route::post('/truck-categories', [TruckCategoryController::class, 'store']);
    Route::put('/truck-categories/{category}', [TruckCategoryController::class, 'update']);
    Route::delete('/truck-categories/{category}', [TruckCategoryController::class, 'destroy']);

    // Orange products
    Route::post('/oranges', [OrangeProductController::class, 'store']);
    Route::put('/oranges/{orange}', [OrangeProductController::class, 'update']);
    Route::delete('/oranges/{orange}', [OrangeProductController::class, 'destroy']);
    Route::post('/oranges/{orange}/images', [OrangeProductController::class, 'uploadImage']);
    Route::delete('/oranges/{orange}/images/{image}', [OrangeProductController::class, 'deleteImage']);

    // Orange categories
    Route::post('/orange-categories', [OrangeCategoryController::class, 'store']);
    Route::put('/orange-categories/{category}', [OrangeCategoryController::class, 'update']);
    Route::delete('/orange-categories/{category}', [OrangeCategoryController::class, 'destroy']);

    // Rentals
    Route::get('/rentals', [RentalController::class, 'index']);
    Route::post('/rentals', [RentalController::class, 'store']);
    Route::get('/rentals/{rental}', [RentalController::class, 'show']);
    Route::put('/rentals/{rental}', [RentalController::class, 'update']);
    Route::post('/rentals/{rental}/cancel', [RentalController::class, 'cancel']);
    Route::delete('/rentals/{rental}', [RentalController::class, 'destroy']);

    // Drivers & gaji (mobile: manajemen driver)
    Route::get('/drivers', [DriverController::class, 'index']);
    Route::post('/drivers', [DriverController::class, 'store']);
    Route::get('/drivers/{driver}', [DriverController::class, 'show']);
    Route::put('/drivers/{driver}', [DriverController::class, 'update']);
    Route::delete('/drivers/{driver}', [DriverController::class, 'destroy']);
    Route::get('/drivers/{driver}/salaries', [DriverController::class, 'salaries']);
    Route::post('/drivers/{driver}/salaries', [DriverController::class, 'storeSalary']);
    Route::put('/drivers/{driver}/salaries/{salary}', [DriverController::class, 'updateSalary']);
    Route::post('/drivers/{driver}/salaries/{salary}/pay', [DriverController::class, 'paySalary']);
    Route::get('/drivers/{driver}/salary-summary', [DriverController::class, 'salarySummary']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Konfirmasi pembayaran tunai (face_to_face / COD) — admin.
    // Hanya mengubah payment_status; alur order tetap dijalankan terpisah.
    Route::post('/orders/{order}/payment/confirm', [PaymentController::class, 'confirmCashPayment']);
    Route::post('/orders/{order}/payment/reject', [PaymentController::class, 'rejectCashPayment']);

    // Deliveries
    Route::get('/deliveries', [DeliveryController::class, 'index']);
    Route::post('/deliveries', [DeliveryController::class, 'store']);
    Route::get('/deliveries/{delivery}', [DeliveryController::class, 'show']);
    Route::put('/deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus']);
    Route::delete('/deliveries/{delivery}', [DeliveryController::class, 'destroy']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);

    // Leads
    Route::get('/leads', [LeadController::class, 'index']);
    Route::get('/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/leads/{lead}', [LeadController::class, 'update']);
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);

    // Reports
    Route::get('/reports', [ReportController::class, 'index']);

    // Download APK
    Route::get('/download/apk', [DownloadController::class, 'apk']);
});