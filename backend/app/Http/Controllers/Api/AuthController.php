<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Storage;
use App\Models\Post;


class AuthController extends Controller
{
    // Register API (POST)
    public function register(Request $request){
        // Data validation
        $request->validate([
            "email" => "required|email|unique:users",
            "username" => "required|unique:users",
            "password" => "required|confirmed"
        ]);

        // Create User
        $user = User::create([
            "email" => $request->email,
            "username" => $request->username,
            "password" => Hash::make($request->password),
            "role" => "user"
        ]);

        return response()->json([
            "status" => true,
            "message" => "User created in successfully.",
            "role" => $user->role // Include user role in the response
        ]);
    }

    public function login(Request $request){
        // Data validation
        $request->validate([
            "email" => "required|email",
            "password" => "required"
        ]);

        // Check if user exists and credentials are correct
        if(Auth::attempt([
            "email" => $request->email,
            "password" => $request->password
        ])){
            $user = Auth::user();

            // Generate token if verified
            $token = $user->createToken("userToken")->accessToken;

            return response()->json([
                "status" => true,
                "message" => "User logged in successfully",
                "token" => $token,
                "role" => $user->role // Include user role in the response
            ]);
        }else{
            return response()->json([
                "status" => false,
                "message" => "Invalid login details"
            ]);
        }
    }

    public function logout(Request $request){
        if (Auth::check()) {
            Auth::user()->token()->revoke();
            return response()->json(['message' => 'Logged out successfully']);
        } else {
            return response()->json(['error' => 'Not authenticated']);
        }
    }

    public function profile(Request $request) {
        $user = Auth::user();
    
        if (!$user) {
            return response()->json([
                "status" => false,
                "message" => "Unauthorized",
            ], 401);
        }

        // Get user's posts with their forums
        $posts = $user->posts()
            ->with(['forum:id,name,slug'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get user's games
        $games = $user->games()
            ->select('forums.id', 'forums.name', 'forums.slug')
            ->get();
    
        return response()->json([
            "status" => true,
            "message" => "Profile information",
            "user" => [
                "id" => $user->id,
                "username" => $user->username,
                "email" => $user->email,
                "bio" => $user->bio,  
                "profile_picture" => $user->profile_picture,  
                "banner" => $user->banner,
                "posts" => $posts,
                "games" => $games,
                "followers_count" => $user->followers()->count(),
                "following_count" => $user->following()->count()
            ],
        ]);
    }

    public function updateProfile(Request $request) {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                "status" => false,
                "message" => "Unauthorized",
            ], 401);
        }

        // Validate the request
        $request->validate([
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'bio' => 'nullable|string|max:1000',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'games' => 'nullable|array',
            'games.*' => 'exists:forums,id'
        ]);

        // Update username if provided
        if ($request->has('username')) {
            $user->username = $request->username;
        }

        // Update bio if provided
        if ($request->has('bio')) {
            $user->bio = $request->bio;
        }

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($user->profile_picture) {
                $oldPath = str_replace('/storage/', '', $user->profile_picture);
                Storage::delete('public/' . $oldPath);
            }
            
            $profilePicture = $request->file('profile_picture');
            $profilePicturePath = $profilePicture->store('profile_pictures', 'public');
            $user->profile_picture = '/storage/' . $profilePicturePath;
        }

        // Handle banner upload
        if ($request->hasFile('banner')) {
            // Delete old banner if exists
            if ($user->banner) {
                $oldPath = str_replace('/storage/', '', $user->banner);
                Storage::delete('public/' . $oldPath);
            }
            
            $banner = $request->file('banner');
            $bannerPath = $banner->store('banners', 'public');
            $user->banner = '/storage/' . $bannerPath;
        }

        $user->save();

        // Update games if provided
        if ($request->has('games')) {
            $user->games()->sync($request->games);
        }

        return response()->json([
            "status" => true,
            "message" => "Profile updated successfully",
            "user" => [
                "username" => $user->username,
                "bio" => $user->bio,
                "profile_picture" => $user->profile_picture,
                "banner" => $user->banner,
                "games" => $user->games()->select('forums.id', 'forums.name', 'forums.slug')->get()
            ],
        ]);
    }

    
    public function showUserProfile($username)
    {
        $user = User::where('username', $username)
            ->with(['posts.tags', 'posts.forum', 'games:id,name,slug'])
            ->withCount(['followers', 'following'])
            ->firstOrFail();
        $authUser = auth()->user();

        return response()->json([
            'user' => $user,
            'is_following' => $authUser->following->contains($user->id)
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json([]);
        }

        $users = User::where('username', 'LIKE', "%{$query}%")
            ->select('id', 'username', 'profile_picture')
            ->limit(10)
            ->get();

        return response()->json($users);
    }

    public function searchUserProfile(Request $request)
    {
        $query = $request->input('query');
        $gameId = $request->input('game_id');

        $usersQuery = User::query()
            ->where('id', '!=', auth()->id()); // Exclude current user

        if ($query) {
            $usersQuery->where('username', 'LIKE', "%{$query}%");
        }

        if ($gameId) {
            $usersQuery->whereHas('games', function ($q) use ($gameId) {
                $q->where('forums.id', $gameId);
            });
        }

        $users = $usersQuery->select('id', 'username', 'profile_picture', 'bio')
            ->with(['games:id,name,slug'])
            ->get();

        return response()->json($users);
    }

    public function following()
    {
        try {
            $users = Auth::user()
                ->following()
                ->select('id', 'username', 'profile_picture')
                ->get();

            return response()->json($users);
        } catch (\Exception $e) {
            \Log::error('Error fetching following users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch following users'], 500);
        }
    }

    public function followingPosts()
    {
        try {
            \Log::info('Fetching posts from followed users');
            $followingIds = Auth::user()->following()->pluck('users.id');
            \Log::info('Following IDs: ' . $followingIds->toJson());
            
            $posts = Post::whereIn('user_id', $followingIds)
                ->with(['user:id,username,profile_picture', 'forum:id,name,slug'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            \Log::info('Found ' . $posts->count() . ' posts');
            
            $mappedPosts = $posts->map(function ($post) {
                return [
                    'id' => $post->id,
                    'forum_id' => $post->forum_id,
                    'forum_name' => $post->forum->name,
                    'user' => [
                        'id' => $post->user->id,
                        'username' => $post->user->username,
                        'profile_picture' => $post->user->profile_picture,
                    ],
                    'title' => $post->title,
                    'content' => $post->content,
                    'likes' => $post->likes,
                    'dislikes' => $post->dislikes,
                    'comment_count' => $post->comments()->count(),
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ];
            });

            return response()->json(['posts' => $mappedPosts]);
        } catch (\Exception $e) {
            \Log::error('Error fetching following posts: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch following posts'], 500);
        }
    }
}