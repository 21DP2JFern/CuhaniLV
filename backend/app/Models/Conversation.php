<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'created_at',
        'updated_at'
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_user')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function otherUser()
    {
        return $this->users()->where('users.id', '!=', auth()->id())->first();
    }

    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latest();
    }

    public function getUnreadCountAttribute()
    {
        return $this->messages()
            ->where('user_id', '!=', auth()->id())
            ->where('is_read', false)
            ->count();
    }
} 