<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
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
use Illuminate\Support\Facades\Route;

// Authentication — rate limited (60 requests per minute)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:60,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:60,1');

// Named 'login' route required by Sanctum middleware for unauthenticated redirects.
// Returns JSON 401 instead of redirect for API consumers.
Route::get('/login', fn () => response()->json([
    'success' => false,
    'message' => 'Unauthenticated.',
], 401))->name('login');

// Public: truck browsing & categories
Route::get('/trucks', [TruckController::class, 'index']);
Route::get('/trucks/{truck}', [TruckController::class, 'show']);
Route::get('/truck-categories', [TruckCategoryController::class, 'index']);

// Public: orange marketplace
Route::get('/oranges', [OrangeProductController::class, 'index']);
Route::get('/oranges/{orange}', [OrangeProductController::class, 'show']);
Route::get('/orange-categories', [OrangeCategoryController::class, 'index']);

// Public: contact sales (lead inquiry)
Route::post('/leads', [LeadController::class, 'store']);

// Public: rental availability check
Route::get('/trucks/{truck}/availability', [RentalController::class, 'availability']);
Route::get('/trucks/{truck}/availability/calendar', [RentalController::class, 'calendar']);
Route::get('/reviews', [ReviewController::class, 'index']);

// Public: landing page stats
Route::get('/site-stats', [SiteStatsController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::post('/orders/{order}/payment', [PaymentController::class, 'store']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'read']);

    // Dashboard (role-aware summary)
    Route::get('/dashboard', [DashboardController::class, 'stats']);

    // Trucks (CRUD & media)
    Route::post('/trucks', [TruckController::class, 'store']);
    Route::put('/trucks/{truck}', [TruckController::class, 'update']);
    Route::delete('/trucks/{truck}', [TruckController::class, 'destroy']);
    Route::post('/trucks/{truck}/images', [TruckController::class, 'uploadImage']);
    Route::delete('/trucks/{truck}/images/{image}', [TruckController::class, 'deleteImage']);

    // Wishlist
    Route::get('/wishlists', [TruckController::class, 'myWishlist']);
    Route::post('/trucks/{truck}/wishlist', [TruckController::class, 'toggleWishlist']);

    // Truck categories (admin)
    Route::post('/truck-categories', [TruckCategoryController::class, 'store']);
    Route::put('/truck-categories/{category}', [TruckCategoryController::class, 'update']);
    Route::delete('/truck-categories/{category}', [TruckCategoryController::class, 'destroy']);

    // Orange products (admin & orange_seller)
    Route::post('/oranges', [OrangeProductController::class, 'store']);
    Route::put('/oranges/{orange}', [OrangeProductController::class, 'update']);
    Route::delete('/oranges/{orange}', [OrangeProductController::class, 'destroy']);
    Route::post('/oranges/{orange}/images', [OrangeProductController::class, 'uploadImage']);
    Route::delete('/oranges/{orange}/images/{image}', [OrangeProductController::class, 'deleteImage']);

    // Orange categories (admin)
    Route::post('/orange-categories', [OrangeCategoryController::class, 'store']);
    Route::put('/orange-categories/{category}', [OrangeCategoryController::class, 'update']);
    Route::delete('/orange-categories/{category}', [OrangeCategoryController::class, 'destroy']);

    // Rentals (customer & admin)
    Route::get('/rentals', [RentalController::class, 'index']);
    Route::post('/rentals', [RentalController::class, 'store']);
    Route::get('/rentals/{rental}', [RentalController::class, 'show']);
    Route::put('/rentals/{rental}', [RentalController::class, 'update']);
    Route::delete('/rentals/{rental}', [RentalController::class, 'destroy']);

    // Orders (customer & admin)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Deliveries (admin; customer lihat via detail order)
    Route::get('/deliveries', [DeliveryController::class, 'index']);
    Route::post('/deliveries', [DeliveryController::class, 'store']);
    Route::get('/deliveries/{delivery}', [DeliveryController::class, 'show']);
    Route::put('/deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus']);
    Route::delete('/deliveries/{delivery}', [DeliveryController::class, 'destroy']);

    // Users (admin)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);

    // Leads (sales & admin)
    Route::get('/leads', [LeadController::class, 'index']);
    Route::get('/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/leads/{lead}', [LeadController::class, 'update']);
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);

    // Reports (admin only)
    Route::get('/reports', [ReportController::class, 'index']);
});
