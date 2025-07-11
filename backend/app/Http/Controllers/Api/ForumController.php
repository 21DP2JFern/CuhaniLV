<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Forum;
use App\Models\Post;
use App\Models\Comment;
use App\Models\PostTag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\ImageService;

class ForumController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 12);
        $forums = Forum::select([
            'id',
            'name',
            'slug',
            'description',
            'image_url',
            'member_count',
            'post_count'
        ])->orderBy('member_count', 'desc')
        ->paginate($perPage);
        return response()->json([
            'status' => true,
            'forums' => $forums->items(),
            'hasMore' => $forums->hasMorePages()
        ])->header('Cache-Control', 'public, max-age=120'); // Cache for 2 minutes
    }

    public function getTopForums()
    {
        $topForums = Forum::select([
            'id',
            'name',
            'slug',
            'description',
            'image_url',
            'member_count',
            'post_count'
        ])
        ->orderBy('member_count', 'desc')
        ->take(4)
        ->get();
        
        return response()->json([
            'status' => true,
            'forums' => $topForums
        ])->header('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:forums',
            'slug' => 'required|string|max:255|unique:forums',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $forum = new Forum();
        $forum->name = $request->name;
        $forum->slug = $request->slug;
        $forum->description = $request->description;
        $forum->user_id = auth()->id();

        if ($request->hasFile('image')) {
            $forum->image = ImageService::compressAndStore(
                $request->file('image'),
                'forum_images',
                80,  // quality
                800, // max width for forum images
                800  // max height for forum images
            );
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
        // Get forum with optimized query
        $forum = Forum::select([
            'id',
            'name',
            'slug',
            'description',
            'image_url',
            'member_count',
            'post_count',
            'user_id'
        ])
        ->where('slug', $slug)
        ->firstOrFail();

        // Get posts with optimized query
        $posts = Post::select([
            'posts.id',
            'posts.title',
            'posts.content',
            'posts.created_at',
            'posts.forum_id',
            'posts.user_id',
            DB::raw('(SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND is_like = 1) as likes'),
            DB::raw('(SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND is_like = 0) as dislikes'),
            DB::raw('(SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count')
        ])
        ->with([
            'user:id,username,profile_picture',
            'tags:id,tag'
        ])
        ->where('forum_id', $forum->id)
        ->orderBy('created_at', 'desc')
        ->paginate(10);

        // Add is_member flag
        $user = Auth::user();
        $forum->is_member = $user ? $user->forumMemberships()->where('forums.id', $forum->id)->exists() : false;

        // Add vote status if user is authenticated
        if ($user) {
            $userId = $user->id;
            $posts->getCollection()->transform(function ($post) use ($userId) {
                $post->is_liked = DB::table('post_votes')
                    ->where('post_id', $post->id)
                    ->where('user_id', $userId)
                    ->where('is_like', 1)
                    ->exists();
                $post->is_disliked = DB::table('post_votes')
                    ->where('post_id', $post->id)
                    ->where('user_id', $userId)
                    ->where('is_like', 0)
                    ->exists();
                return $post;
            });
        }

        return response()->json([
            'forum' => $forum,
            'posts' => $posts
        ])->header('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
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
        }])
        ->where('forum_id', $forumId)
        ->findOrFail($postId);

        // Add user's vote status to the post
        if (auth()->check()) {
            $post->is_liked = $post->isLikedBy(auth()->user());
            $post->is_disliked = $post->isDislikedBy(auth()->user());
            $post->current_user_role = auth()->user()->role;
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
        $user = auth()->user();

        // Check if the user is either the author of the post or an admin
        if ($post->user_id !== $user->id && $user->role !== 'admin') {
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
        $user = auth()->user();

        // Check if the user is either the author of the post or an admin
        if ($post->user_id !== $user->id && $user->role !== 'admin') {
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

    public function joinForum($forumId)
    {
        try {
            $user = Auth::user();
            $forum = Forum::findOrFail($forumId);

            DB::transaction(function () use ($user, $forum) {
                // First check if the relationship exists
                $exists = $user->games()->where('forum_id', $forum->id)->exists();

                if ($exists) {
                    // Update existing relationship
                    $user->games()->updateExistingPivot($forum->id, [
                        'is_member' => true,
                        'joined_at' => now()
                    ]);
                } else {
                    // Create new relationship
                    $user->games()->attach($forum->id, [
                        'is_member' => true,
                        'joined_at' => now()
                    ]);
                }

                $forum->increment('member_count');
            });

            return response()->json([
                'status' => true,
                'message' => 'Successfully joined the forum',
                'forum' => $forum->load('members')
            ]);
        } catch (\Exception $e) {
            \Log::error('Error joining forum: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to join forum',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function leaveForum($forumId)
    {
        try {
            $user = Auth::user();
            $forum = Forum::findOrFail($forumId);

            DB::transaction(function () use ($user, $forum) {
                // Check if the user is actually a member
                $isMember = $user->games()
                    ->where('forum_id', $forum->id)
                    ->where('is_member', true)
                    ->exists();

                if ($isMember) {
                    $user->games()->updateExistingPivot($forum->id, [
                        'is_member' => false,
                        'joined_at' => null
                    ]);

                    $forum->decrement('member_count');
                }
            });

            return response()->json([
                'status' => true,
                'message' => 'Successfully left the forum',
                'forum' => $forum->load('members')
            ]);
        } catch (\Exception $e) {
            \Log::error('Error leaving forum: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to leave forum',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function savePost($postId)
    {
        try {
            $post = Post::findOrFail($postId);
            $user = auth()->user();

            if (!$post->isSavedBy($user)) {
                $post->savedBy()->attach($user->id);
            }

            return response()->json([
                'status' => true,
                'message' => 'Post saved successfully',
                'is_saved' => true
            ]);
        } catch (\Exception $e) {
            \Log::error('Error saving post: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to save post',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function unsavePost($postId)
    {
        try {
            $post = Post::findOrFail($postId);
            $user = auth()->user();

            if ($post->isSavedBy($user)) {
                $post->savedBy()->detach($user->id);
            }

            return response()->json([
                'status' => true,
                'message' => 'Post unsaved successfully',
                'is_saved' => false
            ]);
        } catch (\Exception $e) {
            \Log::error('Error unsaving post: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to unsave post',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getSavedPosts()
    {
        try {
            $user = auth()->user();
            $savedPosts = $user->savedPosts()
                ->with(['user', 'tags', 'forum'])
                ->withCount(['comments', 'likedBy', 'dislikedBy'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Add is_saved flag to each post
            $savedPosts->each(function ($post) {
                $post->is_saved = true;
            });

            return response()->json([
                'status' => true,
                'posts' => $savedPosts
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching saved posts: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch saved posts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $forum = Forum::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:forums,name,' . $id,
            'slug' => 'required|string|max:255|unique:forums,slug,' . $id,
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $forum->name = $request->name;
        $forum->slug = $request->slug;
        $forum->description = $request->description;

        if ($request->hasFile('image')) {
            // Delete old image if exists
            ImageService::deleteImage($forum->image);
            
            // Compress and store new image
            $forum->image = ImageService::compressAndStore(
                $request->file('image'),
                'forum_images',
                80,  // quality
                800, // max width for forum images
                800  // max height for forum images
            );
        }

        $forum->save();

        return response()->json([
            'status' => true,
            'message' => 'Forum updated successfully',
            'forum' => $forum
        ]);
    }

    public function getPopularPosts(Request $request)
    {
        $perPage = $request->input('per_page', 6);
        $page = $request->input('page', 1);

        // Optimize query by selecting only needed fields and eager loading relationships
        $posts = Post::select([
            'posts.id',
            'posts.title',
            'posts.content',
            'posts.created_at',
            'posts.forum_id',
            'posts.user_id',
            DB::raw('(SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND is_like = 1) as likes'),
            DB::raw('(SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND is_like = 0) as dislikes'),
            DB::raw('(SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count')
        ])
        ->with([
            'forum:id,name,slug',
            'user:id,username,profile_picture',
            'tags:id,tag'
        ])
        ->orderByRaw('(SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND is_like = 1) - (SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND is_like = 0) DESC')
        ->paginate($perPage, ['*'], 'page', $page);

        // Add is_liked and is_disliked flags if user is authenticated
        if (auth()->check()) {
            $userId = auth()->id();
            $posts->getCollection()->transform(function ($post) use ($userId) {
                $post->is_liked = DB::table('post_votes')
                    ->where('post_id', $post->id)
                    ->where('user_id', $userId)
                    ->where('is_like', 1)
                    ->exists();
                $post->is_disliked = DB::table('post_votes')
                    ->where('post_id', $post->id)
                    ->where('user_id', $userId)
                    ->where('is_like', 0)
                    ->exists();
                return $post;
            });
        }

        return response()->json([
            'posts' => $posts->items(),
            'hasMore' => $posts->hasMorePages()
        ])->header('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    }
} 