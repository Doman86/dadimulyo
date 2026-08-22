<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['orange_product_id', 'image_path', 'is_primary', 'sort_order'])]
class OrangeImage extends Model
{
    public function orangeProduct(): BelongsTo
    {
        return $this->belongsTo(OrangeProduct::class);
    }
}
