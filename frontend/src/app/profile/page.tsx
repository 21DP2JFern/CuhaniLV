'use client'
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Cookies from 'js-cookie';
import Header from '@/components/Header';

// Define the profile structure
interface Profile {
    username: string;
    bio?: string;
    profile_picture?: string;
    banner?: string;
    posts?: Post[];
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
    tags?: Tag[];
}

interface Tag {
    id: number;
    tag: string;
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
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [following, setFollowing] = useState<Follower[]>([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
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

    const fetchFollowers = async () => {
        if (!profile?.username) return;
        try {
            const response = await axiosInstance.get<Follower[]>(`/users/${profile.username}/followers`);
            setFollowers(response.data);
        } catch (err) {
            console.error('Error fetching followers:', err);
        }
    };

    const fetchFollowing = async () => {
        if (!profile?.username) return;
        try {
            const response = await axiosInstance.get<Follower[]>(`/users/${profile.username}/following`);
            setFollowing(response.data);
        } catch (err) {
            console.error('Error fetching following:', err);
        }
    };

    useEffect(() => {
        if (showFollowers && profile?.username) {
            fetchFollowers();
        }
    }, [showFollowers, profile?.username]);

    useEffect(() => {
        if (showFollowing && profile?.username) {
            fetchFollowing();
        }
    }, [showFollowing, profile?.username]);

    // Show a loading indicator while fetching
    if (loading) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="container mx-auto px-4 py-8 mt-20">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
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
            <div className="w-[60%] h-56 mt-24 rounded-md bg-gray-700 flex justify-center items-center relative">
                {profile?.banner ? (
                    <img src={`${BACKEND_URL}${profile.banner}`} alt="Banner" className="w-full h-full rounded-md object-cover" />
                ) : (
                    <p className="text-gray-400">No banner uploaded</p>
                )}
                {/* Gap in banner */}
                <div className="absolute -bottom-16 left-[15%] w-40 h-40 bg-main-gray rounded-full border-4 border-gray-800"></div>
            </div>

            {/* Profile Picture */}
            <div className="w-40 h-40 rounded-full bg-gray-600 -mt-24 flex justify-center items-center border-4 border-gray-800 relative z-10 -ml-[34.5%]">
                {profile?.profile_picture ? (
                    <img src={`${BACKEND_URL}${profile.profile_picture}`} alt="Profile" className="w-[153px] h-[153px] rounded-full object-cover" />
                ) : (
                    <p className="text-gray-300">No Image</p>
                )}
            </div>

            {/* Profile Info Container */}
            <div className="w-[60%] -mt-10 flex justify-between items-start">
                {/* Username & Bio */}
                <div className="w-[45%] ml-[30%]">
                    <h1 className="text-3xl font-semibold">{profile?.username ?? 'Unknown User'}</h1>
                    <div className="flex gap-4 mt-2 text-gray-400">
                        <button 
                            onClick={() => setShowFollowers(!showFollowers)}
                            className="hover:text-white transition-colors"
                        >
                            {profile?.followers_count} Followers
                        </button>
                        <span>•</span>
                        <button 
                            onClick={() => setShowFollowing(!showFollowing)}
                            className="hover:text-white transition-colors"
                        >
                            {profile?.following_count} Following
                        </button>
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

                {/* Buttons */}
                <div className="flex space-x-4">
                    <button 
                        className="px-6 py-2 bg-gray-700 transition-all duration-300 hover:bg-gray-800 rounded-md text-white"
                        onClick={() => router.push('/edit-profile')}
                    >
                        Edit Profile
                    </button>
                    <button className="px-6 py-2 bg-main-red transition-all duration-300 hover:bg-red-700 rounded-md text-white"
                        onClick={async () => { 
                            try {
                                await axiosInstance.post('/logout');
                                Cookies.remove('auth_token');
                                router.push('/');
                            } catch (error) {
                                console.error('Logout failed:', error);
                            }
                        }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Followers/Following Lists */}
            {(showFollowers || showFollowing) && (
                <div className="w-[60%] mt-4 bg-gray-800 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        {showFollowers ? 'Followers' : 'Following'}
                    </h2>
                    <div className="grid gap-4">
                        {(showFollowers ? followers : following).map((user) => (
                            <div
                                key={user.id}
                                onClick={() => router.push(`/users/${user.username}`)}
                                className="flex items-center gap-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                                    {user.profile_picture ? (
                                        <img
                                            src={`${BACKEND_URL}${user.profile_picture}`}
                                            alt={user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center text-sm text-gray-400 h-full">
                                            No Img
                                        </div>
                                    )}
                                </div>
                                <span className="text-lg font-medium hover:text-main-red transition-colors">
                                    {user.username}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="w-full flex justify-end mt-16 mb-8">
                {/* Posts Section */}
                <div className="w-[40%] mr-[22%]">
                    <h2 className="text-2xl font-bold mb-4">My Posts</h2>
                    {profile?.posts && profile.posts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 auto-rows-[150px]">
                            {profile.posts.map((post) => {
                                // Calculate content length to determine card size
                                const contentLength = post.content.length;
                                const rowSpan = contentLength > 500 ? 3 : contentLength > 200 ? 2 : 1;
                                
                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => router.push(`/forums/${post.forum.slug}/posts/${post.id}`)}
                                        className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors row-span-${rowSpan}`}
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
                                                        className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                                                    >
                                                        {tag.tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8">
                            <p>You haven't made any posts yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
