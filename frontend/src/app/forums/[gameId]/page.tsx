'use client'

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Forum, Post } from '@/services/forumService';
import { useQuery } from '@tanstack/react-query';

const POSTS_PER_PAGE = 10;

export default function GameForumPage({ params }: { params: Promise<{ gameId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        tags: '',
    });
    const [currentPage, setCurrentPage] = useState(1);

    // React Query for forum data
    const {
        data: forumData,
        isLoading: isLoadingForum,
        isFetching: isFetchingForum,
        refetch: refetchForum,
    } = useQuery<{ forum: Forum; posts: { data: Post[]; next_page_url: string | null } }>({
        queryKey: ['forum', resolvedParams.gameId, currentPage],
        queryFn: () => forumService.getForum(resolvedParams.gameId, currentPage, POSTS_PER_PAGE),
        placeholderData: (prev) => prev,
        staleTime: 120000,
    });

    const forum: Forum | null = forumData?.forum || null;
    const posts: Post[] = forumData?.posts?.data || [];
    const hasMore: boolean = forumData?.posts?.next_page_url !== null;

    // Debug logs
    console.log('forumData:', forumData);
    console.log('posts:', posts);

    // Ensure posts is an array before iterating
    const sortedPosts = Array.isArray(posts) ? [...posts].sort((a, b) => {
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
    }) : [];

    console.log('sortedPosts:', sortedPosts);

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
            refetchForum();
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const handlePostLike = async (postId: number) => {
        try {
            await forumService.likePost(postId);
            refetchForum();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handlePostDislike = async (postId: number) => {
        try {
            await forumService.dislikePost(postId);
            refetchForum();
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
                refetchForum();
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
            await refetchForum();
        } catch (error) {
            console.error('Error toggling forum membership:', error);
        } finally {
            setIsJoining(false);
        }
    };

    if (isLoadingForum || isFetchingForum) {
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
                className="flex flex-col justify-between mt-24 mx-auto bg-gray-800 h-[300px] w-full max-w-[1536px] rounded-lg p-4 md:p-10 relative"
                style={{
                    backgroundImage: forum.image_url ? `url(http://127.0.0.1:8000${forum.image_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: '10% 10%',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="absolute inset-0 bg-gray-800 rounded-lg opacity-80" />
                <div className='relative z-10'>
                    <h1 className="text-2xl md:text-3xl font-bold">{forum.name}</h1>
                    <p className="text-gray-400 text-sm md:text-base">{forum.description}</p>
                    <div className="mt-2 text-gray-400 text-sm md:text-base">
                        {forum.member_count} members
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button
                        onClick={handleJoinForum}
                        disabled={isJoining}
                        className={`w-28 md:w-36 h-9 px-2 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
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
                            className="w-28 md:w-36 h-9 px-2 md:px-4 py-2 bg-main-red hover:bg-red-700 text-white rounded-lg text-sm md:text-base"
                        >
                            Create Post
                        </button>
                    )}
                </div>
            </div>
            <div className="container mx-auto px-4 py-8 mt-5">
                <div className="flex gap-4 mb-6">
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
                                            onClick={(e) => handlePostLike(post.id)}
                                            className={`flex items-center gap-1 ${
                                                post.is_liked ? 'text-main-red' : 'text-gray-400 hover:text-main-red'
                                            }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill={post.is_liked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75A2.25 2.25 0 0 1 16.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                                            </svg>
                                            {post.likes}
                                        </button>
                                        <button
                                            onClick={(e) => handlePostDislike(post.id)}
                                            className={`flex items-center gap-1 ${
                                                post.is_disliked ? 'text-main-red' : 'text-gray-400 hover:text-main-red'
                                            }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill={post.is_disliked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 0 1-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54m.023-8.25H16.48a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 1 1.423.23M17.25 15H15m-8.25 0h2.25" />
                                            </svg>
                                            {post.dislikes}
                                        </button>
                                        <button
                                            onClick={(e) => handleSavePost(e, post.id)}
                                            className={`flex items-center gap-1 ${
                                                post.is_saved ? 'text-main-red' : 'text-gray-400 hover:text-main-red'
                                            }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill={post.is_saved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                            </svg>
                                        </button>
                                        <span className="text-gray-400 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                            </svg>
                                            {post.comment_count}
                                        </span>
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

                {hasMore && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            className="bg-main-red hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                            disabled={isFetchingForum}
                        >
                            {isFetchingForum ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}

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