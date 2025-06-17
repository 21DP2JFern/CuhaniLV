<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Services\ImageService;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'forum_id' => 'required|exists:forums,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id'
        ]);

        $post = new Post();
        $post->title = $request->title;
        $post->content = $request->content;
        $post->forum_id = $request->forum_id;
        $post->user_id = auth()->id();

        if ($request->hasFile('image')) {
            $post->image = ImageService::compressAndStore(
                $request->file('image'),
                'post_images',
                80,  // quality
                1200, // max width for post images
                1200  // max height for post images
            );
        }

        $post->save();

        if ($request->has('tags')) {
            $post->tags()->sync($request->tags);
        }

        return response()->json([
            'status' => true,
            'message' => 'Post created successfully',
            'post' => $post->load(['tags', 'forum', 'user'])
        ]);
    }

    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        // Check if user is authorized to update the post
        if ($post->user_id !== auth()->id()) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'forum_id' => 'required|exists:forums,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id'
        ]);

        $post->title = $request->title;
        $post->content = $request->content;
        $post->forum_id = $request->forum_id;

        if ($request->hasFile('image')) {
            // Delete old image if exists
            ImageService::deleteImage($post->image);
            
            // Compress and store new image
            $post->image = ImageService::compressAndStore(
                $request->file('image'),
                'post_images',
                80,  // quality
                1200, // max width for post images
                1200  // max height for post images
            );
        }

        $post->save();

        if ($request->has('tags')) {
            $post->tags()->sync($request->tags);
        }

        return response()->json([
            'status' => true,
            'message' => 'Post updated successfully',
            'post' => $post->load(['tags', 'forum', 'user'])
        ]);
    }
} 