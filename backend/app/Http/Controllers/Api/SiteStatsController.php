<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrangeCategory;
use App\Models\OrangeProduct;
use App\Models\Review;
use App\Models\Truck;
use App\Models\TruckCategory;
use Illuminate\Http\JsonResponse;

class SiteStatsController extends Controller
{
    public function index(): JsonResponse
    {
        $trucks = Truck::where('status', '!=', 'deleted');

        return response()->json([
            'success' => true,
            'data' => [
                'trucks_total' => (clone $trucks)->count(),
                'trucks_for_sale' => (clone $trucks)->where('is_for_sale', true)->count(),
                'trucks_for_rent' => (clone $trucks)->where('is_for_rent', true)->count(),
                'truck_categories_total' => TruckCategory::count(),
                'oranges_total' => OrangeProduct::where('status', '!=', 'deleted')->count(),
                'oranges_in_stock' => OrangeProduct::where('status', '!=', 'deleted')->where('stock_kg', '>', 0)->count(),
                'orange_stock_kg_total' => (float) OrangeProduct::where('status', '!=', 'deleted')->sum('stock_kg'),
                'orange_categories_total' => OrangeCategory::count(),
                'reviews_total' => Review::where('status', 'approved')->count(),
            ],
        ]);
    }
}