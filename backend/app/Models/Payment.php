<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['order_id', 'rental_id', 'truck_order_id', 'payable_type', 'payment_method', 'amount', 'proof_path', 'notes', 'status', 'paid_at'])]
class Payment extends Model
{
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    public function truckOrder(): BelongsTo
    {
        return $this->belongsTo(TruckOrder::class);
    }
}
