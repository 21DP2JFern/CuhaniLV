'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Forum, Post } from '@/services/forumService';

export default function GameForumPage({ params }: { params: Promise<{ gameId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [forum, setForum] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        tags: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadForumData();
    }, [resolvedParams.gameId]);

    const loadForumData = async () => {
        try {
            const data = await forumService.getForum(resolvedParams.gameId);
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

    const handlePostLike = async (postId: number) => {
        try {
            await forumService.likePost(postId);
            loadForumData();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handlePostDislike = async (postId: number) => {
        try {
            await forumService.dislikePost(postId);
            loadForumData();
        } catch (error) {
            console.error('Error disliking post:', error);
        }
    };

    const handleSavePost = async (e: React.MouseEvent, postId: number) => {
        e.stopPropagation();
        try {
            const post = posts.find(p => p.id === postId);
            if (post) {
                if (post.is_saved) {
                    await forumService.unsavePost(postId);
                    post.is_saved = false;
                } else {
                    await forumService.savePost(postId);
                    post.is_saved = true;
                }
                setPosts([...posts]);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        }
    };

    const handleJoinForum = async () => {
        if (!forum) return;
        setIsJoining(true);
        try {
            if (forum.is_member) {
                await forumService.leaveForum(forum.id);
            } else {
                await forumService.joinForum(forum.id);
            }
            await loadForumData();
        } catch (error) {
            console.error('Error toggling forum membership:', error);
        } finally {
            setIsJoining(false);
        }
    };

    const sortedPosts = [...posts].sort((a, b) => {
        switch (sortBy) {
            case 'hot':
                return b.likes - a.likes;
            case 'new':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'top':
                return b.likes - a.likes;
            default:
                return 0;
        }
    });

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

    if (!forum) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
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
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div 
                className="flex flex-col justify-between mt-24 mx-auto bg-gray-800 h-[300px] w-[1536px] rounded-lg p-10 relative"
                style={{
                    backgroundImage: forum.image_url ? `url(http://127.0.0.1:8000${forum.image_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: '10% 10%',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="absolute inset-0 bg-gray-800 rounded-lg opacity-80" />
                <div className='relative z-10'>
                    <h1 className="text-3xl font-bold">{forum.name}</h1>
                    <p className="text-gray-400">{forum.description}</p>
                    <div className="mt-2 text-gray-400">
                        {forum.member_count} members
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button
                        onClick={handleJoinForum}
                        disabled={isJoining}
                        className={`w-36 h-9 px-4 py-2 rounded-lg transition-colors ${
                            forum.is_member 
                                ? 'bg-gray-700 hover:bg-gray-600' 
                                : 'bg-main-red hover:bg-red-700'
                        }`}
                    >
                        {isJoining ? 'Loading...' : forum.is_member ? 'Leave Forum' : 'Join Forum'}
                    </button>
                    {forum.is_member && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-36 h-9 px-4 py-2 bg-main-red hover:bg-red-700 text-white rounded-lg"
                        >
                            Create Post
                        </button>
                    )}
                </div>
            </div>
            <div className="container justify-center mx-auto px-4 py-8 mt-5">
                

                <div className="flex gap-4 mb-6">
                    {/* <button
                        onClick={() => setSortBy('hot')}
                        className={`px-4 py-2 rounded-lg ${
                            sortBy === 'hot'
                                ? 'bg-main-red text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        Hot
                    </button> */}
                    <button
                        onClick={() => setSortBy('new')}
                        className={`px-4 py-2 rounded-lg ${
                            sortBy === 'new'
                                ? 'bg-main-red text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        New
                    </button>
                    <button
                        onClick={() => setSortBy('top')}
                        className={`px-4 py-2 rounded-lg ${
                            sortBy === 'top'
                                ? 'bg-main-red text-white'
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
                            onClick={() => router.push(`/forums/${resolvedParams.gameId}/posts/${post.id}`)}
                            className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                                    <p className="text-gray-400 mb-4 line-clamp-2">{post.content}</p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePostLike(post.id);
                                            }}
                                            className={`flex items-center gap-1 ${
                                                post.is_liked ? 'text-main-red' : 'text-gray-400 hover:text-main-red'
                                            }`}
                                        >
                                            👍 {post.likes}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePostDislike(post.id);
                                            }}
                                            className={`flex items-center gap-1 ${
                                                post.is_disliked ? 'text-main-red' : 'text-gray-400 hover:text-main-red'
                                            }`}
                                        >
                                            👎 {post.dislikes}
                                        </button>
                                        <button
                                            onClick={(e) => handleSavePost(e, post.id)}
                                            className={`flex items-center gap-1 ${
                                                post.is_saved ? 'text-main-red' : 'text-gray-400 hover:text-main-red'
                                            }`}
                                        >
                                            {post.is_saved ? '🔖' : '📑'}
                                        </button>
                                        <span className="text-gray-400">💬 {post.comment_count}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Posted by {post.user.username}</span>
                                        <span>•</span>
                                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{post.comment_count} comments</span>
                                    </div>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {post.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs"
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative z-50">
                            <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
                            <form onSubmit={handleCreatePost}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Content</label>
                                    <textarea
                                        value={newPost.content}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
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
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
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
                                        className="px-4 py-2 bg-main-red hover:bg-red-700 rounded-lg"
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