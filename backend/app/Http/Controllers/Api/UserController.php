<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Post;
use App\Models\Vote;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function show($username)
    {
        $user = User::select([
            'id',
            'username',
            'bio',
            'profile_picture',
            'banner',
            'created_at'
        ])
        ->withCount(['followers', 'following'])
        ->with(['games:id,name,slug'])
        ->where('username', $username)
        ->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Get posts with optimized eager loading
        $posts = Post::select([
            'id',
            'title',
            'content',
            'created_at',
            'forum_id',
            'user_id'
        ])
        ->with([
            'forum:id,name,slug',
            'tags:id,tag',
            'user:id,username'
        ])
        ->withCount(['likes', 'dislikes', 'comments'])
        ->where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->take(10)
        ->get();

        // Add is_following flag if user is authenticated
        $isFollowing = false;
        if (auth()->check()) {
            $isFollowing = $user->followers()->where('follower_id', auth()->id())->exists();
        }

        // Add vote status for each post if user is authenticated
        if (auth()->check()) {
            $postIds = $posts->pluck('id');
            $userVotes = Vote::where('user_id', auth()->id())
                ->whereIn('post_id', $postIds)
                ->get()
                ->keyBy('post_id');

            $posts->each(function ($post) use ($userVotes) {
                $vote = $userVotes->get($post->id);
                $post->is_liked = $vote && $vote->is_like;
                $post->is_disliked = $vote && !$vote->is_like;
            });
        }

        return response()->json([
            'user' => $user,
            'posts' => $posts,
            'is_following' => $isFollowing
        ])->header('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    }
} 