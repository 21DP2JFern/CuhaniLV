<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Forum;
use App\Models\Post;
use App\Models\Comment;
use App\Models\PostTag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ForumController extends Controller
{
    public function index()
    {
        $forums = Forum::all();
        return response()->json([
            'status' => true,
            'forums' => $forums
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:forums',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $forum = new Forum();
        $forum->name = $request->name;
        $forum->slug = Str::slug($request->name);
        $forum->description = $request->description;
        $forum->user_id = auth()->id();

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imagePath = $image->store('forum_images', 'public');
            $forum->image_url = '/storage/' . $imagePath;
        }

        $forum->save();

        return response()->json([
            'status' => true,
            'message' => 'Forum created successfully',
            'forum' => $forum
        ]);
    }

    public function show($slug)
    {
        $forum = Forum::where('slug', $slug)->firstOrFail();
        $posts = $forum->posts()
            ->with(['user', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'forum' => $forum,
            'posts' => $posts
        ]);
    }

    public function createPost(Request $request, $forumId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|string'
        ]);

        $forum = Forum::findOrFail($forumId);
        $post = new Post();
        $post->forum_id = $forumId;
        $post->user_id = auth()->id();
        $post->title = $request->title;
        $post->content = $request->content;
        $post->save();

        // Handle tags
        if ($request->has('tags')) {
            $tags = explode(',', $request->tags);
            foreach ($tags as $tag) {
                $tag = trim($tag);
                if (!empty($tag)) {
                    PostTag::create([
                        'post_id' => $post->id,
                        'tag' => $tag
                    ]);
                }
            }
        }

        // Update forum post count
        $forum->increment('post_count');

        return response()->json([
            'status' => true,
            'message' => 'Post created successfully',
            'post' => $post->load(['user', 'tags'])
        ]);
    }

    public function showPost($forumId, $postId)
    {
        $post = Post::with(['user', 'tags', 'comments.user', 'comments.replies.user'])
            ->where('forum_id', $forumId)
            ->findOrFail($postId);

        return response()->json([
            'status' => true,
            'post' => $post
        ]);
    }

    public function createComment(Request $request, $postId)
    {
        $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id'
        ]);

        $post = Post::findOrFail($postId);
        $comment = new Comment();
        $comment->post_id = $postId;
        $comment->user_id = auth()->id();
        $comment->parent_id = $request->parent_id;
        $comment->content = $request->content;
        $comment->save();

        // Update post comment count if it's a top-level comment
        if (!$request->parent_id) {
            $post->increment('comment_count');
        }

        return response()->json([
            'status' => true,
            'message' => 'Comment created successfully',
            'comment' => $comment->load('user')
        ]);
    }

    public function upvotePost($postId)
    {
        $post = Post::findOrFail($postId);
        $post->increment('upvotes');

        return response()->json([
            'status' => true,
            'message' => 'Post upvoted successfully',
            'upvotes' => $post->upvotes
        ]);
    }

    public function upvoteComment($commentId)
    {
        $comment = Comment::findOrFail($commentId);
        $comment->increment('upvotes');

        return response()->json([
            'status' => true,
            'message' => 'Comment upvoted successfully',
            'upvotes' => $comment->upvotes
        ]);
    }
} 