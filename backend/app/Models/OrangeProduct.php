<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'seller_id',
    'category_id',
    'name',
    'description',
    'grade',
    'price_per_kg',
    'wholesale_price',
    'stock_kg',
    'minimum_order_kg',
    'harvest_date',
    'farm_location',
    'status',
])]
class OrangeProduct extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'harvest_date' => 'date',
        ];
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(OrangeCategory::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(OrangeImage::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
