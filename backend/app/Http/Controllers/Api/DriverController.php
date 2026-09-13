<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\DriverSalary;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DriverController extends Controller
{
    public function __construct()
    {
        // Manajemen driver adalah fitur internal (admin).
        $this->middleware(function (Request $request, $next) {
            if (! $request->user()?->isAdmin()) {
                abort(403, 'Hanya admin yang dapat mengelola driver.');
            }

            return $next($request);
        });
    }

    public function index(Request $request): JsonResponse
    {
        $drivers = Driver::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = $request->string('search')->toString();
                $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('license_number', 'like', "%{$s}%"));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('driver_type'), fn ($q) => $q->where('driver_type', $request->string('driver_type')->toString()))
            ->orderBy('name')
            ->paginate($request->input('per_page', 20));

        // Statistik agregat bulan berjalan: rental dihandle, rating, penghasilan.
        $period = now()->format('Y-m');
        $stats = DriverSalary::where('period', $period)
            ->selectRaw('driver_id, SUM(rental_count) as rentals, AVG(NULLIF(average_rating, 0)) as rating, SUM(net_salary) as earnings')
            ->groupBy('driver_id')
            ->get()
            ->keyBy('driver_id');

        $items = collect($drivers->items())->map(function (Driver $driver) use ($stats) {
            $s = $stats->get($driver->id);

            return array_merge($driver->toArray(), [
                'total_rentals_handled' => $s ? (int) $s->rentals : null,
                'average_rating' => $s && $s->rating !== null ? round((float) $s->rating, 2) : null,
                'total_earnings_this_month' => $s ? (float) $s->earnings : null,
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $items,
                'current_page' => $drivers->currentPage(),
                'last_page' => $drivers->lastPage(),
                'per_page' => $drivers->perPage(),
                'total' => $drivers->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $driver = Driver::create($this->validateDriver($request));

        return response()->json([
            'success' => true,
            'message' => 'Driver berhasil ditambahkan.',
            'data' => $driver,
        ], 201);
    }

    public function show(Driver $driver): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $driver,
        ]);
    }

    public function update(Request $request, Driver $driver): JsonResponse
    {
        $driver->update($this->validateDriver($request));

        return response()->json([
            'success' => true,
            'message' => 'Data driver berhasil diperbarui.',
            'data' => $driver->fresh(),
        ]);
    }

    public function destroy(Driver $driver): JsonResponse
    {
        $driver->delete();

        return response()->json([
            'success' => true,
            'message' => 'Driver berhasil dihapus.',
        ]);
    }

    public function salaries(Request $request, Driver $driver): JsonResponse
    {
        $query = $driver->salaries()->orderByDesc('period')->orderByDesc('id');

        if ($request->filled('period')) {
            $query->where('period', $request->string('period')->toString());
        }

        $salaries = $query->paginate($request->input('per_page', 20))->withQueryString();

        $items = collect($salaries->items())->map(function (DriverSalary $salary) use ($driver) {
            return array_merge($salary->toArray(), [
                'driver_name' => $driver->name,
                // Kontrak aplikasi mobile: total pendapatan kotor & jumlah komisi.
                'total_income' => (float) $salary->base_salary + (float) $salary->rental_commission + (float) $salary->delivery_commission,
                'commission_amount' => (float) $salary->rental_commission + (float) $salary->delivery_commission,
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $items,
                'current_page' => $salaries->currentPage(),
                'last_page' => $salaries->lastPage(),
                'per_page' => $salaries->perPage(),
                'total' => $salaries->total(),
            ],
        ]);
    }

    public function storeSalary(Request $request, Driver $driver): JsonResponse
    {
        $validated = $request->validate([
            'period' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'rental_commission' => ['nullable', 'numeric', 'min:0'],
            'delivery_commission' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'bonus_target' => ['nullable', 'numeric', 'min:0'],
            'bonus_rating' => ['nullable', 'numeric', 'min:0'],
            'deduction' => ['nullable', 'numeric', 'min:0'],
            'late_deduction' => ['nullable', 'numeric', 'min:0'],
            'complaint_deduction' => ['nullable', 'numeric', 'min:0'],
            'rental_count' => ['nullable', 'integer', 'min:0'],
            'delivery_count' => ['nullable', 'integer', 'min:0'],
            'average_rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // auto=1: hitung komisi/aktivitas otomatis dari data pengiriman nyata.
        if ($request->boolean('auto')) {
            $validated = array_merge($validated, $this->computePeriodActivity($driver, $validated['period']));
        }

        $salary = DB::transaction(function () use ($validated, $driver) {
            $net = (float) ($validated['base_salary'] ?? 0)
                + (float) ($validated['rental_commission'] ?? 0)
                + (float) ($validated['delivery_commission'] ?? 0)
                + (float) ($validated['bonus'] ?? 0)
                + (float) ($validated['bonus_target'] ?? 0)
                + (float) ($validated['bonus_rating'] ?? 0)
                - (float) ($validated['deduction'] ?? 0)
                - (float) ($validated['late_deduction'] ?? 0)
                - (float) ($validated['complaint_deduction'] ?? 0);

            return $driver->salaries()->updateOrCreate(
                ['period' => $validated['period']],
                array_merge($validated, ['net_salary' => max(0, $net)])
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Slip gaji berhasil disimpan.',
            'data' => $salary,
        ], 201);
    }

    public function updateSalary(Request $request, Driver $driver, DriverSalary $salary): JsonResponse
    {
        abort_unless($salary->driver_id === $driver->id, 404);

        if ($salary->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Slip gaji yang sudah dibayar tidak dapat diubah.',
            ], 422);
        }

        $validated = $request->validate([
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'rental_commission' => ['nullable', 'numeric', 'min:0'],
            'delivery_commission' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'bonus_target' => ['nullable', 'numeric', 'min:0'],
            'bonus_rating' => ['nullable', 'numeric', 'min:0'],
            'deduction' => ['nullable', 'numeric', 'min:0'],
            'late_deduction' => ['nullable', 'numeric', 'min:0'],
            'complaint_deduction' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $merged = array_merge($salary->only([
            'base_salary', 'rental_commission', 'delivery_commission',
            'bonus', 'bonus_target', 'bonus_rating',
            'deduction', 'late_deduction', 'complaint_deduction',
        ]), $validated);

        $net = (float) $merged['base_salary']
            + (float) $merged['rental_commission']
            + (float) $merged['delivery_commission']
            + (float) $merged['bonus']
            + (float) $merged['bonus_target']
            + (float) $merged['bonus_rating']
            - (float) $merged['deduction']
            - (float) $merged['late_deduction']
            - (float) $merged['complaint_deduction'];

        $salary->update(array_merge($validated, ['net_salary' => max(0, $net)]));

        return response()->json([
            'success' => true,
            'message' => 'Slip gaji berhasil diperbarui.',
            'data' => $salary->fresh(),
        ]);
    }

    public function paySalary(Request $request, Driver $driver, DriverSalary $salary): JsonResponse
    {
        abort_unless($salary->driver_id === $driver->id, 404);

        if ($salary->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Slip gaji ini sudah dibayar.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'transfer', 'ewallet'])],
        ]);

        $salary->update([
            'status' => 'paid',
            'payment_method' => $validated['payment_method'] ?? 'cash',
            'payment_date' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gaji berhasil ditandai sebagai dibayar.',
            'data' => $salary->fresh(),
        ]);
    }

    public function salarySummary(Driver $driver, Request $request): JsonResponse
    {
        $period = $request->input('period', now()->format('Y-m'));

        $totals = $driver->salaries()
            ->where('period', $period)
            ->selectRaw("
                COALESCE(SUM(base_salary), 0) as total_base_salary,
                COALESCE(SUM(rental_commission), 0) as total_rental_commission,
                COALESCE(SUM(delivery_commission), 0) as total_delivery_commission,
                COALESCE(SUM(bonus + bonus_target + bonus_rating), 0) as total_bonus,
                COALESCE(SUM(deduction + late_deduction + complaint_deduction), 0) as total_deduction,
                COALESCE(SUM(net_salary), 0) as total_net_salary,
                COALESCE(SUM(rental_count), 0) as total_rentals,
                COALESCE(SUM(delivery_count), 0) as total_deliveries,
                COALESCE(AVG(NULLIF(average_rating, 0)), 0) as average_rating
            ")
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'period' => (string) $period,
                'total_base_salary' => (float) $totals->total_base_salary,
                'total_rental_commission' => (float) $totals->total_rental_commission,
                'total_delivery_commission' => (float) $totals->total_delivery_commission,
                'total_bonus' => (float) $totals->total_bonus,
                'total_deduction' => (float) $totals->total_deduction,
                'total_net_salary' => (float) $totals->total_net_salary,
                'total_rentals' => (int) $totals->total_rentals,
                'total_deliveries' => (int) $totals->total_deliveries,
                'average_rating' => round((float) $totals->average_rating, 2),
            ],
        ]);
    }

    /**
     * Hitung aktivitas nyata driver pada satu periode dari data pengiriman:
     * jumlah trip (pengiriman), trip yang memakai truck (rental dihandle),
     * lalu komisi dan bonus target sesuai konfigurasi driver.
     *
     * @return array<string, float|int>
     */
    private function computePeriodActivity(Driver $driver, string $period): array
    {
        [$year, $month] = array_map('intval', explode('-', $period));
        $from = sprintf('%04d-%02d-01 00:00:00', $year, $month);
        $to = date('Y-m-t 23:59:59', strtotime($from));

        $userId = $this->driverUserId($driver);

        $deliveryCount = $userId
            ? Delivery::where('driver_id', $userId)->whereBetween('created_at', [$from, $to])->count()
            : 0;

        $rentalCount = $userId
            ? Delivery::where('driver_id', $userId)->whereBetween('created_at', [$from, $to])->whereNotNull('truck_id')->count()
            : 0;

        $baseSalary = $driver->driver_type === 'tetap' ? (float) ($driver->base_salary ?? 0) : 0.0;

        // Komisi rental: nominal tetap per rental, atau % komisi (fallback nominal 0 bila tak ada basis).
        $rentalCommission = $driver->rental_commission !== null
            ? (float) $driver->rental_commission * $rentalCount
            : 0.0;

        $deliveryCommission = $driver->delivery_commission !== null
            ? (float) $driver->delivery_commission * $deliveryCount
            : 0.0;

        $bonusTarget = ($driver->monthly_target !== null
            && $driver->bonus_target_amount !== null
            && $rentalCount >= $driver->monthly_target)
            ? (float) $driver->bonus_target_amount
            : 0.0;

        return [
            'base_salary' => $baseSalary,
            'rental_commission' => $rentalCommission,
            'delivery_commission' => $deliveryCommission,
            'bonus_target' => $bonusTarget,
            'rental_count' => $rentalCount,
            'delivery_count' => $deliveryCount,
        ];
    }

    private function driverUserId(Driver $driver): ?int
    {
        if (! $driver->email) {
            return null;
        }

        return User::where('email', $driver->email)->value('id');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateDriver(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'license_class' => ['nullable', 'string', 'max:10'],
            'address' => ['nullable', 'string', 'max:1000'],
            'profile_image' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'suspended'])],
            'driver_type' => ['required', 'string', Rule::in(['tetap', 'lepas'])],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'delivery_commission' => ['nullable', 'numeric', 'min:0'],
            'rental_commission' => ['nullable', 'numeric', 'min:0'],
            'monthly_target' => ['nullable', 'integer', 'min:0'],
            'bonus_target_amount' => ['nullable', 'numeric', 'min:0'],
            'bonus_rating_amount' => ['nullable', 'numeric', 'min:0'],
            'late_deduction' => ['nullable', 'numeric', 'min:0'],
            'complaint_deduction' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
