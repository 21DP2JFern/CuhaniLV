'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Forum, Post } from '@/services/forumService';

export default function GameForumPage({ params }: { params: { gameId: string } }) {
    const router = useRouter();
    const [forum, setForum] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        tags: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadForumData();
    }, [params.gameId]);

    const loadForumData = async () => {
        try {
            const data = await forumService.getForum(params.gameId);
            setForum(data.forum);
            setPosts(data.posts);
        } catch (error) {
            console.error('Error loading forum data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forum) return;

        try {
            await forumService.createPost(forum.id, {
                title: newPost.title,
                content: newPost.content,
                tags: newPost.tags,
            });
            setIsCreateModalOpen(false);
            setNewPost({ title: '', content: '', tags: '' });
            loadForumData();
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const sortedPosts = [...posts].sort((a, b) => {
        switch (sortBy) {
            case 'hot':
                return b.upvotes - a.upvotes;
            case 'new':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'top':
                return b.upvotes - a.upvotes;
            default:
                return 0;
        }
    });

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

    if (!forum) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Forum not found</h1>
                        <button
                            onClick={() => router.push('/forums')}
                            className="text-blue-500 hover:text-blue-400"
                        >
                            Return to Forums
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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{forum.name}</h1>
                        <p className="text-gray-400">{forum.description}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Create Post
                    </button>
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setSortBy('hot')}
                        className={`px-4 py-2 rounded-lg ${
                            sortBy === 'hot'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        Hot
                    </button>
                    <button
                        onClick={() => setSortBy('new')}
                        className={`px-4 py-2 rounded-lg ${
                            sortBy === 'new'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        New
                    </button>
                    <button
                        onClick={() => setSortBy('top')}
                        className={`px-4 py-2 rounded-lg ${
                            sortBy === 'top'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        Top
                    </button>
                </div>

                <div className="space-y-4">
                    {sortedPosts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => router.push(`/forums/${params.gameId}/posts/${post.id}`)}
                            className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            forumService.upvotePost(post.id);
                                        }}
                                        className="text-gray-400 hover:text-blue-500"
                                    >
                                        ▲
                                    </button>
                                    <span className="text-sm text-gray-400">{post.upvotes}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Implement downvote functionality
                                        }}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        ▼
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                                    <p className="text-gray-400 mb-4 line-clamp-2">{post.content}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Posted by {post.user.name}</span>
                                        <span>•</span>
                                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{post.comment_count} comments</span>
                                    </div>
                                    {post.tags.length > 0 && (
                                        <div className="flex gap-2 mt-2">
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
                    ))}
                </div>

                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
                            <form onSubmit={handleCreatePost}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Content</label>
                                    <textarea
                                        value={newPost.content}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                        rows={5}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={newPost.tags}
                                        onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                        placeholder="e.g., strategy, tips, bugs"
                                    />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                                    >
                                        Create Post
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 