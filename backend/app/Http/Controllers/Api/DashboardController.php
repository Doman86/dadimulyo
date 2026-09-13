<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeadResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\RentalResource;
use App\Http\Resources\TruckOrderResource;
use App\Http\Resources\TruckResource;
use App\Models\Lead;
use App\Models\OrangeProduct;
use App\Models\Order;
use App\Models\Rental;
use App\Models\Truck;
use App\Models\TruckOrder;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return $this->adminStats();
        }

        if ($user->isSales()) {
            return $this->salesStats($user);
        }

        if ($user->isTruckSeller()) {
            return $this->truckSellerStats($user);
        }

        if ($user->hasRole('orange_seller')) {
            return $this->orangeSellerStats($user);
        }

        return $this->customerStats($user);
    }

    private function respond(array $data): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function adminStats(): JsonResponse
    {
        $revenue = (float) Order::where('payment_status', 'paid')->sum('total');

        return $this->respond([
            'summary' => [
                'trucks_total' => Truck::where('status', '!=', 'deleted')->count(),
                'trucks_available' => Truck::where('status', 'available')->count(),
                'rentals_total' => Rental::count(),
                'rentals_active' => Rental::whereIn('status', ['pending', 'confirmed', 'active'])->count(),
                'orders_total' => Order::count(),
                'orders_pending' => Order::where('status', 'pending')->count(),
                'revenue' => $revenue,
                'leads_total' => Lead::count(),
                'leads_new' => Lead::where('status', 'new')->count(),
                'users_total' => User::count(),
                'oranges_total' => OrangeProduct::where('status', '!=', 'deleted')->count(),
            ],
            'recent_orders' => OrderResource::collection(
                Order::with(['customer', 'shippingAddress', 'items.orangeProduct', 'delivery.truck', 'delivery.driver'])
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
            ),
            'recent_leads' => LeadResource::collection(
                Lead::with('truck')->orderByDesc('created_at')->limit(5)->get()
            ),
            'recent_rentals' => RentalResource::collection(
                Rental::with(['truck.images', 'customer'])->orderByDesc('created_at')->limit(5)->get()
            ),
        ]);
    }

    private function salesStats(User $user): JsonResponse
    {
        $leads = Lead::where(fn ($q) => $q->where('sales_id', $user->id)->orWhereNull('sales_id'));

        $byStatus = function (string $status) use ($leads) {
            return (clone $leads)->where('status', $status)->count();
        };

        return $this->respond([
            'summary' => [
                'leads_total' => (clone $leads)->count(),
                'leads_new' => $byStatus('new'),
                'leads_contacted' => $byStatus('contacted'),
                'leads_negotiating' => $byStatus('negotiating'),
                'leads_won' => $byStatus('won'),
                'leads_lost' => $byStatus('lost'),
                'customers_total' => User::whereHas('role', fn ($q) => $q->where('name', 'customer'))->count(),
            ],
            'recent_leads' => LeadResource::collection(
                (clone $leads)->with('truck')->orderByDesc('created_at')->limit(5)->get()
            ),
        ]);
    }

    private function truckSellerStats(User $user): JsonResponse
    {
        $trucks = Truck::where('seller_id', $user->id)->where('status', '!=', 'deleted');
        $truckIds = (clone $trucks)->pluck('id');

        return $this->respond([
            'summary' => [
                'trucks_total' => (clone $trucks)->count(),
                'trucks_available' => (clone $trucks)->where('status', 'available')->count(),
                'leads_total' => Lead::whereIn('truck_id', $truckIds)->count(),
                'leads_new' => Lead::whereIn('truck_id', $truckIds)->where('status', 'new')->count(),
            ],
            'recent_trucks' => TruckResource::collection(
                (clone $trucks)->with(['category', 'images', 'seller'])->orderByDesc('created_at')->limit(5)->get()
            ),
            'recent_leads' => LeadResource::collection(
                Lead::whereIn('truck_id', $truckIds)->with('truck')->orderByDesc('created_at')->limit(5)->get()
            ),
        ]);
    }

    private function orangeSellerStats(User $user): JsonResponse
    {
        $products = OrangeProduct::where('seller_id', $user->id)->where('status', '!=', 'deleted');

        return $this->respond([
            'summary' => [
                'oranges_total' => (clone $products)->count(),
                'stock_total_kg' => (float) (clone $products)->sum('stock_kg'),
                'orders_total' => Order::whereHas('items.orangeProduct', fn ($q) => $q->where('seller_id', $user->id))->count(),
            ],
            'recent_products' => $products->orderByDesc('created_at')->limit(5)->get(['id', 'name', 'grade', 'price_per_kg', 'stock_kg', 'status']),
        ]);
    }

    private function customerStats(User $user): JsonResponse
    {
        return $this->respond([
            'summary' => [
                'orders_total' => Order::where('customer_id', $user->id)->count(),
                'orders_pending' => Order::where('customer_id', $user->id)->where('status', 'pending')->count(),
                'rentals_total' => Rental::where('customer_id', $user->id)->count(),
                'rentals_active' => Rental::where('customer_id', $user->id)->whereIn('status', ['pending', 'confirmed', 'active'])->count(),
                'wishlist_total' => $user->wishlists()->count(),
            ],
            'recent_orders' => OrderResource::collection(
                Order::with(['customer', 'shippingAddress', 'items.orangeProduct', 'delivery.truck', 'delivery.driver'])
                    ->where('customer_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
            ),
            'recent_rentals' => RentalResource::collection(
                Rental::with(['truck.images', 'customer'])
                    ->where('customer_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
            ),
            'recent_wishlists' => TruckResource::collection(
                Truck::whereIn('id', $user->wishlists()->pluck('truck_id'))
                    ->with(['category', 'images', 'seller'])
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
            ),
            'truck_orders_total' => TruckOrder::where('customer_id', $user->id)->count(),
            'recent_truck_orders' => TruckOrderResource::collection(
                TruckOrder::with(['truck.images', 'customer', 'payments'])
                    ->where('customer_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
            ),
        ]);
    }
}
