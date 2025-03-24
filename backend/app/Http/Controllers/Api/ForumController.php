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
        $post = Post::with(['user', 'tags', 'comments' => function($query) {
            $query->whereNull('parent_id')
                  ->with(['user', 'replies' => function($query) {
                      $query->with(['user', 'replies' => function($query) {
                          $query->with(['user', 'replies' => function($query) {
                              $query->with(['user', 'replies' => function($query) {
                                  $query->with(['user', 'replies' => function($query) {
                                      $query->with(['user', 'replies' => function($query) {
                                          $query->with(['user', 'replies' => function($query) {
                                              $query->with(['user', 'replies' => function($query) {
                                                  $query->with(['user', 'replies' => function($query) {
                                                      $query->with(['user', 'replies' => function($query) {
                                                          $query->with('user');
                                                      }]);
                                                  }]);
                                              }]);
                                          }]);
                                      }]);
                                  }]);
                              }]);
                          }]);
                      }]);
                  }]);
        }])
        ->where('forum_id', $forumId)
        ->findOrFail($postId);

        // Add user's vote status to the post
        if (auth()->check()) {
            $post->is_liked = $post->isLikedBy(auth()->user());
            $post->is_disliked = $post->isDislikedBy(auth()->user());
        }

        // Add user's vote status to all comments
        if (auth()->check()) {
            $this->addVoteStatusToComments($post->comments);
        }

        return response()->json([
            'status' => true,
            'post' => $post
        ]);
    }

    private function addVoteStatusToComments($comments)
    {
        foreach ($comments as $comment) {
            $comment->is_liked = $comment->isLikedBy(auth()->user());
            $comment->is_disliked = $comment->isDislikedBy(auth()->user());
            if ($comment->replies->count() > 0) {
                $this->addVoteStatusToComments($comment->replies);
            }
        }
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

    public function likePost($postId)
    {
        $post = Post::findOrFail($postId);
        $post->toggleLike(auth()->user());

        return response()->json([
            'status' => true,
            'message' => 'Post like toggled successfully',
            'likes' => $post->likes,
            'dislikes' => $post->dislikes,
            'is_liked' => $post->isLikedBy(auth()->user()),
            'is_disliked' => $post->isDislikedBy(auth()->user())
        ]);
    }

    public function dislikePost($postId)
    {
        $post = Post::findOrFail($postId);
        $post->toggleDislike(auth()->user());

        return response()->json([
            'status' => true,
            'message' => 'Post dislike toggled successfully',
            'likes' => $post->likes,
            'dislikes' => $post->dislikes,
            'is_liked' => $post->isLikedBy(auth()->user()),
            'is_disliked' => $post->isDislikedBy(auth()->user())
        ]);
    }

    public function likeComment($commentId)
    {
        $comment = Comment::findOrFail($commentId);
        $comment->toggleLike(auth()->user());

        return response()->json([
            'status' => true,
            'message' => 'Comment like toggled successfully',
            'likes' => $comment->likes,
            'dislikes' => $comment->dislikes,
            'is_liked' => $comment->isLikedBy(auth()->user()),
            'is_disliked' => $comment->isDislikedBy(auth()->user())
        ]);
    }

    public function dislikeComment($commentId)
    {
        $comment = Comment::findOrFail($commentId);
        $comment->toggleDislike(auth()->user());

        return response()->json([
            'status' => true,
            'message' => 'Comment dislike toggled successfully',
            'likes' => $comment->likes,
            'dislikes' => $comment->dislikes,
            'is_liked' => $comment->isLikedBy(auth()->user()),
            'is_disliked' => $comment->isDislikedBy(auth()->user())
        ]);
    }

    public function updatePost(Request $request, $postId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|string'
        ]);

        $post = Post::findOrFail($postId);

        // Check if the user is the author of the post
        if ($post->user_id !== auth()->id()) {
            return response()->json([
                'status' => false,
                'message' => 'You are not authorized to edit this post'
            ], 403);
        }

        $post->title = $request->title;
        $post->content = $request->content;
        $post->save();

        // Handle tags
        if ($request->has('tags')) {
            // Delete existing tags
            $post->tags()->delete();
            
            // Add new tags
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

        return response()->json([
            'status' => true,
            'message' => 'Post updated successfully',
            'post' => $post->load(['user', 'tags'])
        ]);
    }

    public function deletePost($postId)
    {
        $post = Post::findOrFail($postId);

        // Check if the user is the author of the post
        if ($post->user_id !== auth()->id()) {
            return response()->json([
                'status' => false,
                'message' => 'You are not authorized to delete this post'
            ], 403);
        }

        // Update forum post count
        $post->forum->decrement('post_count');

        // Delete the post (cascade will handle comments and tags)
        $post->delete();

        return response()->json([
            'status' => true,
            'message' => 'Post deleted successfully'
        ]);
    }
} 