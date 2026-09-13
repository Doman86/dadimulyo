<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'driver_id',
    'rental_id',
    'base_salary',
    'rental_commission',
    'delivery_commission',
    'bonus',
    'bonus_target',
    'bonus_rating',
    'deduction',
    'late_deduction',
    'complaint_deduction',
    'net_salary',
    'period',
    'rental_count',
    'delivery_count',
    'average_rating',
    'status',
    'payment_method',
    'payment_date',
    'notes',
])]
class DriverSalary extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payment_date' => 'datetime',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }
}
