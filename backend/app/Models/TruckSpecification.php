<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['truck_id', 'key', 'value'])]
class TruckSpecification extends Model
{
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }
}
