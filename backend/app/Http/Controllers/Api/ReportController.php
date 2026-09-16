<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\OrangeProduct;
use App\Models\Order;
use App\Models\Rental;
use App\Models\Truck;
use App\Models\TruckCategory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $period = $request->string('period')->toString(); // 'week', 'month', 'year'

        return response()->json([
            'success' => true,
            'data' => [
                'revenue' => $this->revenueReport($period),
                'orders' => $this->ordersReport($period),
                'trucks' => $this->trucksReport(),
                'oranges' => $this->orangesReport(),
                'leads' => $this->leadsReport($period),
                'rentals' => $this->rentalsReport($period),
                'users' => $this->usersReport(),
            ],
        ]);
    }

    private function revenueReport(string $period): array
    {
        $startDate = $this->getStartDate($period);

        $totalRevenue = (float) Order::where('payment_status', 'paid')->sum('total');
        $periodRevenue = (float) Order::where('payment_status', 'paid')
            ->where('created_at', '>=', $startDate)
            ->sum('total');

        $monthlyRevenue = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as order_count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $revenueByPayment = Order::where('created_at', '>=', $startDate)
            ->select('payment_status', DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_status')
            ->get();

        return [
            'total' => $totalRevenue,
            'period' => $periodRevenue,
            'monthly' => $monthlyRevenue,
            'by_payment_status' => $revenueByPayment,
        ];
    }

    private function ordersReport(string $period): array
    {
        $startDate = $this->getStartDate($period);

        $total = Order::count();
        $periodOrders = Order::where('created_at', '>=', $startDate)->count();

        $byStatus = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        $byPaymentStatus = Order::select('payment_status', DB::raw('COUNT(*) as count'))
            ->groupBy('payment_status')
            ->get();

        $monthlyOrders = Order::where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $avgOrderValue = $periodOrders > 0
            ? (float) Order::where('created_at', '>=', $startDate)->avg('total')
            : 0;

        return [
            'total' => $total,
            'period' => $periodOrders,
            'by_status' => $byStatus,
            'by_payment_status' => $byPaymentStatus,
            'monthly' => $monthlyOrders,
            'avg_value' => round($avgOrderValue, 2),
        ];
    }

    private function trucksReport(): array
    {
        $total = Truck::where('status', '!=', 'deleted')->count();

        $byStatus = Truck::where('status', '!=', 'deleted')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        $byCategory = Truck::where('status', '!=', 'deleted')
            ->join('truck_categories', 'trucks.category_id', '=', 'truck_categories.id')
            ->select('truck_categories.name as category', DB::raw('COUNT(*) as count'))
            ->groupBy('truck_categories.name')
            ->get();

        $byCondition = Truck::where('status', '!=', 'deleted')
            ->select('condition', DB::raw('COUNT(*) as count'))
            ->groupBy('condition')
            ->get();

        $totalValue = Truck::where('status', '!=', 'deleted')->sum('price');
        $rentalAvailable = Truck::where('is_for_rent', true)->where('status', 'available')->count();

        return [
            'total' => $total,
            'by_status' => $byStatus,
            'by_category' => $byCategory,
            'by_condition' => $byCondition,
            'total_value' => (float) $totalValue,
            'rental_available' => $rentalAvailable,
        ];
    }

    private function orangesReport(): array
    {
        $total = OrangeProduct::where('status', '!=', 'deleted')->count();
        $totalStock = (float) OrangeProduct::where('status', '!=', 'deleted')->sum('stock_kg');
        $totalValue = (float) OrangeProduct::where('status', '!=', 'deleted')
            ->selectRaw('SUM(price_per_kg * stock_kg) as value')
            ->value('value');

        $byGrade = OrangeProduct::where('status', '!=', 'deleted')
            ->select('grade', DB::raw('COUNT(*) as count'), DB::raw('SUM(stock_kg) as stock_kg'))
            ->groupBy('grade')
            ->get();

        $byCategory = OrangeProduct::where('status', '!=', 'deleted')
            ->join('orange_categories', 'orange_products.category_id', '=', 'orange_categories.id')
            ->select('orange_categories.name as category', DB::raw('COUNT(*) as count'), DB::raw('SUM(stock_kg) as stock_kg'))
            ->groupBy('orange_categories.name')
            ->get();

        $outOfStock = OrangeProduct::where('status', '!=', 'deleted')->where('stock_kg', '<=', 0)->count();

        return [
            'total' => $total,
            'total_stock_kg' => $totalStock,
            'total_value' => round($totalValue ?? 0, 2),
            'by_grade' => $byGrade,
            'by_category' => $byCategory,
            'out_of_stock' => $outOfStock,
        ];
    }

    private function leadsReport(string $period): array
    {
        $startDate = $this->getStartDate($period);

        $total = Lead::count();
        $periodLeads = Lead::where('created_at', '>=', $startDate)->count();

        $byStatus = Lead::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        $bySource = Lead::select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source')
            ->get();

        $wonCount = Lead::where('status', 'won')->count();
        $conversionRate = $total > 0 ? round(($wonCount / $total) * 100, 1) : 0;

        $monthlyLeads = Lead::where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return [
            'total' => $total,
            'period' => $periodLeads,
            'by_status' => $byStatus,
            'by_source' => $bySource,
            'conversion_rate' => $conversionRate,
            'monthly' => $monthlyLeads,
        ];
    }

    private function rentalsReport(string $period): array
    {
        $startDate = $this->getStartDate($period);

        $total = Rental::count();
        $periodRentals = Rental::where('created_at', '>=', $startDate)->count();
        $totalRevenue = (float) Rental::where('status', '!=', 'cancelled')->sum('total_price');

        $byStatus = Rental::select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_price) as revenue'))
            ->groupBy('status')
            ->get();

        $monthlyRentals = Rental::where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_price) as revenue')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return [
            'total' => $total,
            'period' => $periodRentals,
            'total_revenue' => $totalRevenue,
            'by_status' => $byStatus,
            'monthly' => $monthlyRentals,
        ];
    }

    private function usersReport(): array
    {
        $total = User::count();

        $byRole = User::join('roles', 'users.role_id', '=', 'roles.id')
            ->select('roles.name as role', DB::raw('COUNT(*) as count'))
            ->groupBy('roles.name')
            ->get();

        $newUsersThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

        return [
            'total' => $total,
            'by_role' => $byRole,
            'new_this_month' => $newUsersThisMonth,
        ];
    }

    private function getStartDate(string $period): Carbon
    {
        return match ($period) {
            'week' => now()->subWeek(),
            'year' => now()->subYear(),
            default => now()->subMonth(),
        };
    }

    private function authorizeAdmin(Request $request): void
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat melihat laporan.');
        }
    }

    /**
     * Export laporan sebagai CSV (unduhan).
     * Row pertama = header, baris berikut = data, sudah termasuk ringkasan total.
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorizeAdmin($request);

        $period = $request->string('period')->toString();

        $filename = 'laporan-dadimulyo-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($period) {
            $out = fopen('php://output', 'w');

            // BOM UTF-8 agar Excel membaca karakter non-ASCII dengan benar.
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, ['Laporan Dadi Mulyo', 'Periode', $period, 'Diunduh', now()->format('Y-m-d H:i:s')]);
            fputcsv($out, []);

            $data = [
                'Pendapatan' => $this->revenueReport($period),
                'Pesanan' => $this->ordersReport($period),
                'Lead' => $this->leadsReport($period),
                'Sewa' => $this->rentalsReport($period),
                'Truck' => $this->trucksReport(),
                'Jeruk' => $this->orangesReport(),
                'Pengguna' => $this->usersReport(),
            ];

            foreach ($data as $sectionTitle => $section) {
                fputcsv($out, [$sectionTitle]);

                foreach ($section as $key => $value) {
                    $this->writeCsvRow($out, (string) $key, $value);
                }

                fputcsv($out, []);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Tulis satu baris CSV dari pasangan label-nilai.
     * Menangani skalar, tanggal, dan koleksi/nested array (dengan sub-header).
     */
    private function writeCsvRow($handle, string $label, mixed $value): void
    {
        if ($value instanceof \Illuminate\Support\Collection) {
            $value = $value->all();
        }

        if (is_array($value)) {
            if ($value === []) {
                fputcsv($handle, [$label, '-']);

                return;
            }

            // Array list = tabel; array assoc = label bersarang.
            if (array_is_list($value)) {
                $first = $value[0];
                $columns = is_array($first)
                    ? array_keys($first)
                    : (array) array_keys($value === [] ? [] : $value);

                if (is_array($first)) {
                    fputcsv($handle, [$label]);
                    fputcsv($handle, $columns);

                    foreach ($value as $row) {
                        fputcsv($handle, array_values($row));
                    }

                    return;
                }

                fputcsv($handle, [$label, implode('; ', $value)]);

                return;
            }

            foreach ($value as $subLabel => $subValue) {
                $this->writeCsvRow($handle, "{$label}.{$subLabel}", $subValue);
            }

            return;
        }

        if (is_bool($value)) {
            $value = $value ? '1' : '0';
        }

        fputcsv($handle, [$label, $value instanceof \DateTimeInterface ? $value->format('Y-m-d H:i:s') : (string) $value]);
    }
}
