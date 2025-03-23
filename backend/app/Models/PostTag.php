<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostTag extends Model
{
    protected $fillable = [
        'post_id',
        'tag'
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
} 