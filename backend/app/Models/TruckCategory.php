<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description'])]
class TruckCategory extends Model
{
    public function trucks(): HasMany
    {
        return $this->hasMany(Truck::class);
    }
}
