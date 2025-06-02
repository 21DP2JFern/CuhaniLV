'use client'
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Cookies from 'js-cookie';
import Header from '@/components/Header';
import UsersListModal from '@/components/UsersListModal';
import { forumService } from '@/services/forumService';
import ErrorMessage from '@/components/ErrorMessage';

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
    role?: string;
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
    const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'admin'>('posts');
    const [posts, setPosts] = useState<Post[]>([]);
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('auth_token');
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
            } else if (activeTab === 'saved') {
                console.log('Fetching saved posts...');
                fetchSavedPosts();
            } else if (activeTab === 'admin' && profile.role === 'admin') {
                fetchAdminData();
            }
        }
    }, [profile, activeTab]);

    const fetchSavedPosts = async () => {
        try {
            const response = await forumService.getSavedPosts();
            console.log('Saved posts response:', response);
            if (response && response.posts) {
                console.log('Setting saved posts:', response.posts);
                setSavedPosts(response.posts);
            } else {
                console.log('No saved posts found');
                setSavedPosts([]);
            }
        } catch (error: any) {
            console.error('Error fetching saved posts:', error);
            setError('Failed to load saved posts. Please try again later.');
            setSavedPosts([]);
        }
    };

    const fetchAdminData = async () => {
        try {
            const [usersResponse, statsResponse] = await Promise.all([
                axiosInstance.get('/admin/users'),
                axiosInstance.get('/admin/stats')
            ]);
            setAllUsers(usersResponse.data.users);
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            setError('Failed to load admin data');
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

    const handleDeletePost = async (postId: number) => {
        if (!profile || profile.role !== 'admin') return;
        try {
            await axiosInstance.delete(`/admin/posts/${postId}`);
            setPosts(posts.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!profile || profile.role !== 'admin') return;
        try {
            await axiosInstance.delete(`/admin/users/${userId}`);
            setAllUsers(allUsers.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
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
                    <ErrorMessage message={error} className="max-w-md mx-auto" />
                    <div className="text-center mt-4">
                        <button 
                            onClick={() => router.push('/')} 
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
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
            <div className="w-[90%] md:w-[60%] h-48 md:h-64 mt-24 rounded-md bg-gray-700 flex justify-center items-center relative overflow-hidden">
                {profile?.banner ? (
                    <img src={`${BACKEND_URL}${profile.banner}`} alt="Banner" className="w-full h-full rounded-md object-cover" />
                ) : (
                    <p className="text-gray-400">No banner uploaded</p>
                )}
            </div>

            <div className="w-[90%] md:w-[60%] flex flex-col mt-8 min-h-[calc(100vh-24rem)]">
                {/* Profile Info */}
                <div className="flex flex-col md:flex-row items-start mb-8">
                    {/* Profile Picture */}
                    <div className="min-w-32 md:min-w-44 min-h-32 md:min-h-44 rounded-full bg-gray-600 flex justify-center items-center border-4 border-gray-800 mx-auto md:mx-0">
                        {profile?.profile_picture ? (
                            <img src={`${BACKEND_URL}${profile.profile_picture}`} alt="Profile" className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] rounded-full object-cover" />
                        ) : (
                            <p className="text-gray-300">No Image</p>
                        )}
                    </div>
                    {/* Username & Bio */}
                    <div className="mt-4 md:mt-0 md:ml-8 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-semibold">{profile?.username ?? 'Unknown User'}</h1>
                            <div className="flex gap-4 text-gray-400">
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
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
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

                {/* Mobile Menu Toggle Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden flex items-center justify-between w-full px-6 py-4 bg-gray-800 rounded-lg mb-4"
                >
                    <span className="text-main-red font-light">Menu</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className={`w-6 h-6 text-main-red transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Menu */}
                    <div className={`w-full md:w-[27%] bg-gray-800 rounded-lg flex flex-col h-fit transition-all duration-300 ${
                        isMenuOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 md:max-h-[1000px] opacity-0 md:opacity-100 overflow-hidden md:overflow-visible'
                    }`}>
                        {/* Navigation buttons */}
                        <div className="flex flex-col">
                            {/* Profile Features */}
                            <button 
                                className={`w-full px-6 py-4 text-left transition-colors border-b border-gray-700 flex items-center gap-2 ${
                                    activeTab === 'posts' ? 'text-main-red bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                                onClick={() => {
                                    setActiveTab('posts');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <span>My Posts</span>
                            </button>
                            <button 
                                className={`w-full px-6 py-4 text-left transition-colors border-b border-gray-700 flex items-center gap-2 ${
                                    activeTab === 'saved' ? 'text-main-red bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                                onClick={() => {
                                    setActiveTab('saved');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                                <span>Saved Posts</span>
                            </button>
                            <button 
                                className="w-full px-6 py-4 text-left text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-b border-gray-700 flex items-center gap-2"
                                onClick={() => {
                                    router.push('/messages');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                </svg>
                                <span>Messages</span>
                            </button>

                            {profile?.role === 'admin' && (
                                <button 
                                    className={`w-full px-6 py-4 text-left transition-colors border-b border-gray-700 flex items-center gap-2 ${
                                        activeTab === 'admin' ? 'text-main-red bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                                    onClick={() => {
                                        setActiveTab('admin');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a7.723 7.723 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                    <span>Admin Panel</span>
                                </button>
                            )}

                            {/* Settings Section */}
                            <button 
                                className="w-full px-6 py-4 text-left text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-b border-gray-700 flex items-center gap-2"
                                onClick={() => {
                                    router.push('/edit-profile');
                                    setIsMenuOpen(false);
                                }}
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
                    <div className="w-full md:w-[73%]">
                        {/* Content Section */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4">
                                {activeTab === 'posts' ? 'My Posts' : 
                                 activeTab === 'saved' ? 'Saved Posts' : 
                                 'Admin Panel'}
                            </h2>

                            {activeTab === 'admin' && profile?.role === 'admin' ? (
                                <div className="space-y-8">
                                    {/* Statistics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-800 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                                            <p className="text-2xl">{stats?.total_users || 0}</p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2">Total Posts</h3>
                                            <p className="text-2xl">{stats?.total_posts || 0}</p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2">Total Forums</h3>
                                            <p className="text-2xl">{stats?.total_forums || 0}</p>
                                        </div>
                                    </div>

                                    {/* Users List */}
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4">Users</h3>
                                        <div className="bg-gray-800 rounded-lg overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-700">
                                                        <th className="px-4 py-2 text-left">Username</th>
                                                        <th className="px-4 py-2 text-left">Email</th>
                                                        <th className="px-4 py-2 text-left">Role</th>
                                                        <th className="px-4 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allUsers.map((user) => (
                                                        <tr key={user.id} className="border-t border-gray-700">
                                                            <td className="px-4 py-2">{user.username}</td>
                                                            <td className="px-4 py-2">{user.email}</td>
                                                            <td className="px-4 py-2">{user.role}</td>
                                                            <td className="px-4 py-2">
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="text-red-500 hover:text-red-400"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(activeTab === 'posts' ? posts : savedPosts)?.map((post) => (
                                        <div
                                            key={post.id}
                                            onClick={() => router.push(`/forums/${post.forum.slug}/posts/${post.id}`)}
                                            className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors relative flex flex-col overflow-y-visible"
                                        >
                                            {profile?.role === 'admin' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePost(post.id);
                                                    }}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm text-gray-400">in</span>
                                                <span className="text-sm text-main-red">{post.forum?.name || 'Unknown Forum'}</span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">{post.title || 'Untitled Post'}</h3>
                                            <p className="text-gray-400 mb-4 flex-grow whitespace-normal">{post.content || 'No content available'}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto flex-wrap">
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
                                    ))}
                                    {(activeTab === 'posts' ? posts : savedPosts).length === 0 && (
                                        <div className="col-span-2 text-center text-gray-400 py-8">
                                            <p>{activeTab === 'posts' ? 'You haven\'t made any posts yet.' : 'You haven\'t saved any posts yet.'}</p>
                                        </div>
                                    )}
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
