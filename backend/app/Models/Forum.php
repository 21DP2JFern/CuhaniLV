<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Forum extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_url',
        'member_count',
        'post_count',
        'user_id'
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
} 