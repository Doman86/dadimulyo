<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'truck_id',
    'customer_id',
    'order_number',
    'recipient_name',
    'phone',
    'notes',
    'amount',
    'status',
    'payment_status',
    'midtrans_order_id',
    'midtrans_transaction_id',
    'payment_type',
])]
class TruckOrder extends Model
{
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
