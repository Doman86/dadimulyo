<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'customer_id',
    'sales_id',
    'truck_id',
    'name',
    'phone',
    'message',
    'status',
    'source',
    'notes',
])]
class Lead extends Model
{
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }
}
