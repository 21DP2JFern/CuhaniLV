<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ForumController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\MessageController;

// Handle CORS preflight requests
Route::options('/{any}', function() {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    // Following posts route (must be before other user routes)
    Route::get('/following/posts', [AuthController::class, 'followingPosts'])->name('following.posts');

    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/users/{username}', [AuthController::class, 'showUserProfile']);
    Route::get('/search/users', [AuthController::class, 'searchUserProfile']);

    // Forum routes
    Route::get('/forums', [ForumController::class, 'index']);
    Route::post('/forums', [ForumController::class, 'store']);
    Route::get('/forums/{slug}', [ForumController::class, 'show']);
    Route::post('/forums/{forumId}/join', [ForumController::class, 'joinForum']);
    Route::post('/forums/{forumId}/leave', [ForumController::class, 'leaveForum']);
    Route::post('/forums/{forumId}/posts', [ForumController::class, 'createPost']);
    Route::get('/forums/{forumId}/posts/{postId}', [ForumController::class, 'showPost']);
    Route::post('/forums/posts/{postId}/comments', [ForumController::class, 'createComment']);
    Route::post('/forums/posts/{postId}/like', [ForumController::class, 'likePost']);
    Route::post('/forums/posts/{postId}/dislike', [ForumController::class, 'dislikePost']);
    Route::post('/forums/comments/{commentId}/like', [ForumController::class, 'likeComment']);
    Route::post('/forums/comments/{commentId}/dislike', [ForumController::class, 'dislikeComment']);
    Route::put('/forums/posts/{postId}', [ForumController::class, 'updatePost']);
    Route::delete('/forums/posts/{postId}', [ForumController::class, 'deletePost']);

    // Follow routes
    Route::post('/users/{username}/follow', [FollowController::class, 'follow']);
    Route::delete('/users/{username}/unfollow', [FollowController::class, 'unfollow']);
    Route::get('/users/{username}/followers', [FollowController::class, 'followers']);
    Route::get('/users/{username}/following', [FollowController::class, 'following']);
    Route::get('/users/following', [AuthController::class, 'following']);

    // Message routes
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'messages']);
    Route::post('/users/{username}/messages', [MessageController::class, 'sendMessage']);
});