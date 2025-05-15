'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Post, Comment } from '@/services/forumService';
import axios from '@/services/auth';

export default function PostPage({ params }: { params: Promise<{ gameId: string; postId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPost, setEditedPost] = useState({ title: '', content: '', tags: '' });
    const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);

    useEffect(() => {
        loadPostData();
        loadCurrentUser();
    }, [resolvedParams.gameId, resolvedParams.postId]);

    const loadPostData = async () => {
        try {
            setError(null);
            const data = await forumService.getPost(String(resolvedParams.gameId), parseInt(resolvedParams.postId));
            setPost(data);
        } catch (error: any) {
            console.error('Error loading post data:', error);
            if (error.response?.status === 404) {
                setError('Post not found');
            } else {
                setError('Failed to load post. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentUser = async () => {
        try {
            const response = await axios.get('/profile');
            setCurrentUser({
                id: response.data.user.id,
                username: response.data.user.username
            });
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!post) return;

        try {
            await forumService.createComment(post.id, {
                content: newComment,
            });
            setNewComment('');
            loadPostData();
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    const handleReplySubmit = async (content: string, parentId: number) => {
        if (!post) return;

        try {
            await forumService.createComment(post.id, {
                content,
                parent_id: parentId,
            });
            setReplyingTo(null);
            loadPostData();
        } catch (error) {
            console.error('Error creating reply:', error);
        }
    };

    const ReplyForm = ({ parentId, onCancel }: { parentId: number; onCancel: () => void }) => {
        const [content, setContent] = useState('');

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            await handleReplySubmit(content, parentId);
        };

        return (
            <form
                onSubmit={handleSubmit}
                className="mt-2"
            >
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
                    rows={3}
                    placeholder="Write a reply..."
                    required
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg transition-all duration-300"
                    >
                        Reply
                    </button>
                </div>
            </form>
        );
    };

    const handlePostLike = async () => {
        if (!post) return;
        try {
            await forumService.likePost(post.id);
            loadPostData();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handlePostDislike = async () => {
        if (!post) return;
        try {
            await forumService.dislikePost(post.id);
            loadPostData();
        } catch (error) {
            console.error('Error disliking post:', error);
        }
    };

    const handleCommentLike = async (commentId: number) => {
        try {
            await forumService.likeComment(commentId);
            loadPostData();
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleCommentDislike = async (commentId: number) => {
        try {
            await forumService.dislikeComment(commentId);
            loadPostData();
        } catch (error) {
            console.error('Error disliking comment:', error);
        }
    };

    const handleEditPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!post) return;

        try {
            await forumService.updatePost(post.id, editedPost);
            setIsEditing(false);
            loadPostData();
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const handleDeletePost = async () => {
        if (!post) return;

        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await forumService.deletePost(post.id);
                router.push(`/forums/${resolvedParams.gameId}`);
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    const CommentComponent = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
        const MAX_NESTING_LEVEL = 10;
        const replies = comment.replies || [];
        
        return (
            <div className="mt-4" style={{ marginLeft: `${level * 20}px` }}>
                <div className="flex items-start gap-4">
                    <div className="flex-1">
                        <div className={`relative ${level > 0 ? 'pl-4 border-l-2 border-gray-600' : ''}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{comment.user.username}</span>
                                <span className="text-gray-500 text-sm">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-300 mb-2">{comment.content}</p>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCommentLike(comment.id)}
                                        className={`text-sm ${comment.is_liked ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-500`}
                                    >
                                        {comment.is_liked ? '❤️' : '🤍'} Like
                                    </button>
                                    <span className="text-sm text-gray-400">{comment.likes}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCommentDislike(comment.id)}
                                        className={`text-sm ${comment.is_disliked ? 'text-main-red' : 'text-gray-400'} hover:text-red-700`}
                                    >
                                        {comment.is_disliked ? '👎' : '👎'} Dislike
                                    </button>
                                    <span className="text-sm text-gray-400">{comment.dislikes}</span>
                                </div>
                            </div>
                            {level < MAX_NESTING_LEVEL && (
                                <>
                                    <button
                                        onClick={() => setReplyingTo(comment.id)}
                                        className="text-sm text-main-red hover:text-red-700"
                                    >
                                        Reply
                                    </button>
                                    {replyingTo === comment.id && (
                                        <ReplyForm 
                                            parentId={comment.id} 
                                            onCancel={() => setReplyingTo(null)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                        {replies.length > 0 && level < MAX_NESTING_LEVEL && (
                            <div className="mt-4">
                                {replies.map((reply) => (
                                    <CommentComponent
                                        key={reply.id}
                                        comment={reply}
                                        level={level + 1}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main-red"></div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                        <button
                            onClick={() => router.push(`/forums/${resolvedParams.gameId}`)}
                            className="text-blue-500 hover:text-blue-400"
                        >
                            Return to Forum
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-8 mt-20">
                <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            {isEditing ? (
                                <form onSubmit={handleEditPost}>
                                    <p>Title</p>
                                    <input
                                        type="text"
                                        value={editedPost.title}
                                        onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red mb-4"
                                        required
                                    />
                                    <p>Content</p>
                                    <textarea
                                        value={editedPost.content}
                                        onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red mb-4"
                                        rows={5}
                                        required
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-gray-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg transition-all duration-300"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <h1 className="text-3xl font-bold">{post.title}</h1>
                                        {currentUser && currentUser.id === post.user_id && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditedPost({
                                                            title: post.title,
                                                            content: post.content,
                                                            tags: post.tags.map(t => t.tag).join(', ')
                                                        });
                                                        setIsEditing(true);
                                                    }}
                                                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-800 rounded-lg transition-all duration-300"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={handleDeletePost}
                                                    className="px-3 py-1 text-sm bg-main-red hover:bg-red-700 rounded-lg transition-all duration-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                        <span>Posted by {post.user.username}</span>
                                        <span>•</span>
                                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="prose prose-invert max-w-none mb-6">
                                        {post.content}
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handlePostLike}
                                                className={`text-sm ${post.is_liked ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-500`}
                                            >
                                                {post.is_liked ? '❤️' : '🤍'} Like
                                            </button>
                                            <span className="text-sm text-gray-400">{post.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handlePostDislike}
                                                className={`text-sm ${post.is_disliked ? 'text-main-red' : 'text-gray-400'} hover:text-red-700`}
                                            >
                                                {post.is_disliked ? '👎' : '👎'} Dislike
                                            </button>
                                            <span className="text-sm text-gray-400">{post.dislikes}</span>
                                        </div>
                                    </div>
                                    {post.tags.length > 0 && (
                                        <div className="flex gap-2">
                                            {post.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                                                >
                                                    {tag.tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Comments</h2>
                    <form onSubmit={handleCommentSubmit} className="mb-8">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
                            rows={4}
                            placeholder="Write a comment..."
                            required
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg transition-all duration-300"
                            >
                                Comment
                            </button>
                        </div>
                    </form>

                    <div className="space-y-4">
                        {post.comments?.map((comment) => (
                            <CommentComponent key={comment.id} comment={comment} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 