'use client'
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Cookies from 'js-cookie';
import Header from '@/components/Header';
import UsersListModal from '@/components/UsersListModal';
import { forumService } from '@/services/forumService';

// Define the profile structure
interface Profile {
    username: string;
    bio?: string;
    profile_picture?: string;
    banner?: string;
    posts?: Post[];
    saved_posts?: Post[];
    followers_count: number;
    following_count: number;
    games?: Game[];
}

interface Post {
    id: number;
    title: string;
    content: string;
    created_at: string;
    likes: number;
    dislikes: number;
    comment_count: number;
    forum: {
        id: number;
        name: string;
        slug: string;
    };
    tags: {
        id: number;
        post_id: number;
        tag: string;
        created_at: string;
        updated_at: string;
    }[];
    is_saved?: boolean;
}

interface Follower {
    id: number;
    username: string;
    profile_picture?: string;
}

interface Game {
    id: number;
    name: string;
    slug: string;
}

const BACKEND_URL = 'http://localhost:8000';

export default function Profile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
    const [posts, setPosts] = useState<Post[]>([]);
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const router = useRouter();
    const pathname = usePathname();

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = Cookies.get('auth_token');
                if (!token) {
                    setError("User is not authenticated.");
                    setLoading(false);
                    router.push('/');
                    return;
                }

                const response = await axiosInstance.get<{ user: Profile }>('/profile');
                console.log('Profile response:', response.data);
                setProfile(response.data.user);
                setPosts(response.data.user.posts || []);
            } catch (err: any) {
                console.error('Profile fetch error:', err);
                setError("Error fetching profile. Please try again.");
                if (err.response?.status === 401) {
                    router.push('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    useEffect(() => {
        if (profile) {
            if (activeTab === 'posts') {
                setPosts(profile.posts || []);
            } else {
                fetchSavedPosts();
            }
        }
    }, [profile, activeTab]);

    const fetchSavedPosts = async () => {
        try {
            const response = await forumService.getSavedPosts();
            setSavedPosts(response.posts || []);
        } catch (error: any) {
            console.error('Error fetching saved posts:', error);
            setError('Failed to load saved posts. Please try again later.');
            setSavedPosts([]);
        }
    };

    const handleSavePost = async (postId: number) => {
        if (!profile) return;
        try {
            const response = await forumService.savePost(postId);
            // Update the post's saved status in both posts and saved_posts arrays
            setProfile(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    posts: prev.posts?.map(post => 
                        post.id === postId ? { ...post, is_saved: true } : post
                    ),
                    saved_posts: prev.saved_posts?.map(post => 
                        post.id === postId ? { ...post, is_saved: true } : post
                    )
                };
            });
        } catch (error) {
            console.error('Error saving post:', error);
        }
    };

    const handleUnsavePost = async (postId: number) => {
        if (!profile) return;
        try {
            const response = await forumService.unsavePost(postId);
            // Update the post's saved status in both posts and saved_posts arrays
            setProfile(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    posts: prev.posts?.map(post => 
                        post.id === postId ? { ...post, is_saved: false } : post
                    ),
                    saved_posts: prev.saved_posts?.filter(post => post.id !== postId)
                };
            });
        } catch (error) {
            console.error('Error unsaving post:', error);
        }
    };

    // Show a loading indicator while fetching
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

    // Show error message if authentication fails
    if (error) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="container mx-auto px-4 py-8 mt-20">
                    <div className="text-center text-red-500">
                        {error}
                        <button onClick={() => router.push('/')} className="ml-4 text-blue-400 underline">
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    console.log('Current profile state:', profile);

    return (
        <div className="w-full h-full flex flex-col items-center bg-main-gray text-white">
            <Header />
            {/* Profile Banner */}
            <div className="w-[60%] h-56 mt-24 rounded-md bg-gray-700 flex justify-center items-center relative overflow-hidden">
                {profile?.banner ? (
                    <img src={`${BACKEND_URL}${profile.banner}`} alt="Banner" className="w-full h-full rounded-md object-cover" />
                ) : (
                    <p className="text-gray-400">No banner uploaded</p>
                )}
            </div>

            <div className="w-[60%] flex mt-8 min-h-[calc(100vh-24rem)]">
                {/* Left Menu */}
                <div className="w-[27%] bg-gray-800 rounded-lg flex flex-col h-fit">
                    {/* Navigation buttons */}
                    <div className="flex flex-col">
                        {/* Profile Features */}
                        <button 
                            className={`w-full px-6 py-4 text-left transition-colors border-b border-gray-700 flex items-center gap-2 ${
                                activeTab === 'saved' ? 'text-main-red bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                            onClick={() => setActiveTab('saved')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                            <span>Saved Posts</span>
                        </button>
                        <button 
                            className={`w-full px-6 py-4 text-left transition-colors border-b border-gray-700 flex items-center gap-2 ${
                                activeTab === 'posts' ? 'text-main-red bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                            onClick={() => setActiveTab('posts')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span>My Posts</span>
                        </button>
                        <button 
                            className="w-full px-6 py-4 text-left text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-b border-gray-700 flex items-center gap-2"
                            onClick={() => router.push('/messages')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                            <span>Messages</span>
                        </button>

                        {/* Settings Section */}
                        <button 
                            className="w-full px-6 py-4 text-left text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-b border-gray-700 flex items-center gap-2"
                            onClick={() => router.push('/edit-profile')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            <span>Edit Profile</span>
                        </button>
                        <button 
                            className="w-full px-6 py-4 text-left text-main-red hover:text-red-400 hover:bg-gray-700 transition-colors border-gray-700 flex items-center gap-2"
                            onClick={async () => { 
                                try {
                                    await axiosInstance.post('/logout');
                                    Cookies.remove('auth_token');
                                    router.push('/');
                                } catch (error) {
                                    console.error('Logout failed:', error);
                                }
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="w-[73%] ml-8">
                    {/* Profile Info */}
                    <div className="flex items-start mb-8">
                        {/* Profile Picture */}
                        <div className="min-w-44 min-h-44 rounded-full bg-gray-600 flex justify-center items-center border-4 border-gray-800">
                            {profile?.profile_picture ? (
                                <img src={`${BACKEND_URL}${profile.profile_picture}`} alt="Profile" className="w-[200px] h-[200px] rounded-full object-cover" />
                            ) : (
                                <p className="text-gray-300">No Image</p>
                            )}
                        </div>
                        {/* Username & Bio */}
                        <div className="ml-8">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-semibold">{profile?.username ?? 'Unknown User'}</h1>
                                <div className="flex ml-2 gap-4 text-gray-400">
                                    <button 
                                        onClick={() => setShowFollowersModal(true)}
                                        className="hover:text-white transition-colors"
                                    >
                                        {profile?.followers_count} Followers
                                    </button>
                                    <span>•</span>
                                    <button 
                                        onClick={() => setShowFollowingModal(true)}
                                        className="hover:text-white transition-colors"
                                    >
                                        {profile?.following_count} Following
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-400 mt-2 break-words whitespace-pre-wrap">{profile?.bio ?? 'No bio available'}</p>
                            
                            {profile?.games && profile.games.length > 0 && (
                                <div className="mt-4">
                                    <h2 className="text-xl font-semibold mb-2">Games</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.games.map((game) => (
                                            <div
                                                key={game.id}
                                                onClick={() => router.push(`/forums/${game.slug}`)}
                                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm cursor-pointer transition-colors"
                                            >
                                                {game.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Posts Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">
                            {activeTab === 'posts' ? 'My Posts' : 'Saved Posts'}
                        </h2>
                        <div className="grid grid-cols-2 gap-4 auto-rows-[150px]">
                            {(activeTab === 'posts' ? posts : savedPosts).map((post) => {
                                // Calculate content length to determine card size
                                const contentLength = post.content.length;
                                const rowSpan = contentLength > 500 ? 3 : contentLength > 200 ? 2 : 1;
                                
                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => router.push(`/forums/${post.forum.slug}/posts/${post.id}`)}
                                        className={`bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors row-span-${rowSpan}`}
                                        style={{
                                            gridRow: `span ${rowSpan}`,
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm text-gray-400">in</span>
                                            <span className="text-sm text-main-red">{post.forum.name}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 line-clamp-3">{post.title}</h3>
                                        <p className="text-gray-400 mb-4 flex-grow line-clamp-6">{post.content}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{post.likes} likes</span>
                                            <span>•</span>
                                            <span>{post.dislikes} dislikes</span>
                                            <span>•</span>
                                            <span>{post.comment_count} comments</span>
                                        </div>
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {post.tags.map((tag) => (
                                                    <span
                                                        key={tag.id}
                                                        className="px-2 py-1 bg-gray-600 rounded-full text-xs"
                                                    >
                                                        {tag.tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {(activeTab === 'posts' ? posts : savedPosts).length === 0 && (
                                <div className="col-span-2 text-center text-gray-400 py-8">
                                    <p>{activeTab === 'posts' ? 'You haven\'t made any posts yet.' : 'You haven\'t saved any posts yet.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <UsersListModal
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
                username={profile?.username || ''}
                type="followers"
            />

            <UsersListModal
                isOpen={showFollowingModal}
                onClose={() => setShowFollowingModal(false)}
                username={profile?.username || ''}
                type="following"
            />
        </div>
    );
}
