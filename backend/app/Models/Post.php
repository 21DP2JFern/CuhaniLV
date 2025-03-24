<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Post extends Model
{
    protected $fillable = [
        'forum_id',
        'user_id',
        'title',
        'content',
        'likes',
        'dislikes',
        'comment_count'
    ];

    public function forum(): BelongsTo
    {
        return $this->belongsTo(Forum::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id');
    }

    public function tags(): HasMany
    {
        return $this->hasMany(PostTag::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PostVote::class);
    }

    public function likedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_votes')
            ->wherePivot('is_like', true)
            ->withTimestamps();
    }

    public function dislikedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_votes')
            ->wherePivot('is_like', false)
            ->withTimestamps();
    }

    public function isLikedBy(User $user): bool
    {
        return $this->votes()->where('user_id', $user->id)->where('is_like', true)->exists();
    }

    public function isDislikedBy(User $user): bool
    {
        return $this->votes()->where('user_id', $user->id)->where('is_like', false)->exists();
    }

    public function toggleLike(User $user): void
    {
        $vote = $this->votes()->where('user_id', $user->id)->first();

        if ($vote) {
            if ($vote->is_like) {
                // User is unliking
                $this->decrement('likes');
                $vote->delete();
            } else {
                // User is changing from dislike to like
                $this->decrement('dislikes');
                $this->increment('likes');
                $vote->update(['is_like' => true]);
            }
        } else {
            // User is liking for the first time
            $this->increment('likes');
            $this->votes()->create([
                'user_id' => $user->id,
                'is_like' => true
            ]);
        }
    }

    public function toggleDislike(User $user): void
    {
        $vote = $this->votes()->where('user_id', $user->id)->first();

        if ($vote) {
            if (!$vote->is_like) {
                // User is undisliking
                $this->decrement('dislikes');
                $vote->delete();
            } else {
                // User is changing from like to dislike
                $this->decrement('likes');
                $this->increment('dislikes');
                $vote->update(['is_like' => false]);
            }
        } else {
            // User is disliking for the first time
            $this->increment('dislikes');
            $this->votes()->create([
                'user_id' => $user->id,
                'is_like' => false
            ]);
        }
    }
} 