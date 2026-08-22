<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description'])]
class OrangeCategory extends Model
{
    public function orangeProducts(): HasMany
    {
        return $this->hasMany(OrangeProduct::class);
    }
}
