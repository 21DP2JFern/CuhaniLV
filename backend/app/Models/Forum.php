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

    public function members()
    {
        return $this->belongsToMany(User::class, 'user_games', 'forum_id', 'user_id')
            ->wherePivot('is_member', true)
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    public function allUsers()
    {
        return $this->belongsToMany(User::class, 'user_games', 'forum_id', 'user_id')
            ->withPivot('is_member', 'joined_at')
            ->withTimestamps();
    }
} 