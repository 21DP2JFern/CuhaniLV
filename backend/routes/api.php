<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ForumController;

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
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Forum routes
    Route::get('/forums', [ForumController::class, 'index']);
    Route::post('/forums', [ForumController::class, 'store']);
    Route::get('/forums/{slug}', [ForumController::class, 'show']);
    Route::post('/forums/{forumId}/posts', [ForumController::class, 'createPost']);
    Route::get('/forums/{forumId}/posts/{postId}', [ForumController::class, 'showPost']);
    Route::post('/forums/posts/{postId}/comments', [ForumController::class, 'createComment']);
    Route::post('/forums/posts/{postId}/upvote', [ForumController::class, 'upvotePost']);
    Route::post('/forums/comments/{commentId}/upvote', [ForumController::class, 'upvoteComment']);
});