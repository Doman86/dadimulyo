<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'category_id',
    'seller_id',
    'brand',
    'model',
    'year',
    'price',
    'rental_price_per_day',
    'rental_price_per_week',
    'mileage',
    'engine',
    'transmission',
    'fuel_type',
    'capacity',
    'condition',
    'description',
    'location',
    'status',
    'is_for_sale',
    'is_for_rent',
])]
class Truck extends Model
{
    public function category(): BelongsTo
    {
        return $this->belongsTo(TruckCategory::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(TruckImage::class);
    }

    public function specifications(): HasMany
    {
        return $this->hasMany(TruckSpecification::class);
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
