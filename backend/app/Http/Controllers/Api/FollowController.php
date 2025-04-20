<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function follow($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        $authUser = auth()->user();
        
        if ($authUser->id === $user->id) {
            return response()->json(['message' => 'You cannot follow yourself.'], 400);
        }

        $authUser->following()->syncWithoutDetaching([$user->id]);
        return response()->json(['message' => 'Followed successfully']);
    }

    public function unfollow($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        auth()->user()->following()->detach($user->id);
        return response()->json(['message' => 'Unfollowed successfully']);
    }

    public function followers($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        return response()->json(
            $user->followers()
                ->select('users.id', 'users.username', 'users.profile_picture')
                ->get()
        );
    }

    public function following($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        return response()->json(
            $user->following()
                ->select('users.id', 'users.username', 'users.profile_picture')
                ->get()
        );
    }
}