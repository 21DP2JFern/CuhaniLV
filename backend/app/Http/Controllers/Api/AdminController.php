<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Post;
use App\Models\Forum;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function getUsers()
    {
        $users = User::select('id', 'username', 'email', 'role')->get();
        return response()->json(['users' => $users]);
    }

    public function getStats()
    {
        $stats = [
            'total_users' => User::count(),
            'total_posts' => Post::count(),
            'total_forums' => Forum::count(),
        ];
        return response()->json($stats);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'admin') {
            return response()->json(['error' => 'Cannot delete admin user'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function deletePost($id)
    {
        $post = Post::findOrFail($id);
        $post->delete();
        return response()->json(['message' => 'Post deleted successfully']);
    }
} 