<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['order_id', 'orange_product_id', 'quantity_kg', 'price_per_kg', 'subtotal'])]
class OrderItem extends Model
{
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orangeProduct(): BelongsTo
    {
        return $this->belongsTo(OrangeProduct::class);
    }
}
