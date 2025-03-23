'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Post, Comment } from '@/services/forumService';

export default function PostPage({ params }: { params: { gameId: string; postId: string } }) {
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPostData();
    }, [params.postId]);

    const loadPostData = async () => {
        try {
            const data = await forumService.getPost(parseInt(params.gameId), parseInt(params.postId));
            setPost(data);
        } catch (error) {
            console.error('Error loading post data:', error);
        } finally {
            setLoading(false);
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

    const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
        e.preventDefault();
        if (!post) return;

        try {
            await forumService.createComment(post.id, {
                content: replyContent,
                parent_id: parentId,
            });
            setReplyContent('');
            setReplyingTo(null);
            loadPostData();
        } catch (error) {
            console.error('Error creating reply:', error);
        }
    };

    const CommentComponent = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
        const maxWidth = Math.max(0, 100 - level * 10);
        return (
            <div className="mt-4" style={{ marginLeft: `${level * 20}px` }}>
                <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                        <button
                            onClick={() => forumService.upvoteComment(comment.id)}
                            className="text-gray-400 hover:text-blue-500"
                        >
                            ▲
                        </button>
                        <span className="text-sm text-gray-400">{comment.upvotes}</span>
                        <button
                            onClick={() => {
                                // Implement downvote functionality
                            }}
                            className="text-gray-400 hover:text-red-500"
                        >
                            ▼
                        </button>
                    </div>
                    <div className="flex-1" style={{ maxWidth: `${maxWidth}%` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{comment.user.name}</span>
                            <span className="text-gray-500 text-sm">
                                {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-gray-300 mb-2">{comment.content}</p>
                        <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="text-sm text-blue-500 hover:text-blue-400"
                        >
                            Reply
                        </button>
                        {replyingTo === comment.id && (
                            <form
                                onSubmit={(e) => handleReplySubmit(e, comment.id)}
                                className="mt-2"
                            >
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                    rows={3}
                                    placeholder="Write a reply..."
                                    required
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReplyingTo(null);
                                            setReplyContent('');
                                        }}
                                        className="px-4 py-2 text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                                    >
                                        Reply
                                    </button>
                                </div>
                            </form>
                        )}
                        {comment.replies.map((reply) => (
                            <CommentComponent
                                key={reply.id}
                                comment={reply}
                                level={level + 1}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                        <button
                            onClick={() => router.push(`/forums/${params.gameId}`)}
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
        <div className="min-h-screen bg-gray-900 text-white">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => forumService.upvotePost(post.id)}
                                className="text-gray-400 hover:text-blue-500"
                            >
                                ▲
                            </button>
                            <span className="text-sm text-gray-400">{post.upvotes}</span>
                            <button
                                onClick={() => {
                                    // Implement downvote functionality
                                }}
                                className="text-gray-400 hover:text-red-500"
                            >
                                ▼
                            </button>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <span>Posted by {post.user.name}</span>
                                <span>•</span>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="prose prose-invert max-w-none mb-6">
                                {post.content}
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
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Comments</h2>
                    <form onSubmit={handleCommentSubmit} className="mb-8">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                            rows={4}
                            placeholder="Write a comment..."
                            required
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
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