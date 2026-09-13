<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'phone',
    'email',
    'license_number',
    'license_class',
    'address',
    'profile_image',
    'status',
    'driver_type',
    'base_salary',
    'commission_rate',
    'delivery_commission',
    'rental_commission',
    'monthly_target',
    'bonus_target_amount',
    'bonus_rating_amount',
    'late_deduction',
    'complaint_deduction',
    'notes',
])]
class Driver extends Model
{
    public function salaries(): HasMany
    {
        return $this->hasMany(DriverSalary::class);
    }
}
