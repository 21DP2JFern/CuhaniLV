'use client'
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Cookies from 'js-cookie';
import Header from '@/components/Header';
import axios from '@/services/auth';
import UsersListModal from '@/components/UsersListModal';

interface Profile {
    id: number;
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

interface Game {
    id: number;
    name: string;
    slug: string;
}

const BACKEND_URL = 'http://localhost:8000';

export default function PublicProfile() {
    const router = useRouter();
    const params = useParams();
    const username = params?.username as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = Cookies.get('auth_token');
                if (!token) {
                    router.push('/');
                    return;
                }

                const res = await axiosInstance.get(`/users/${username}`);
                setProfile(res.data.user);
                setIsFollowing(res.data.is_following); // Assuming API sends this
            } catch (err: any) {
                console.error('Error loading user profile:', err);
                setError('Failed to load user profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    const handleFollowToggle = async () => {
        try {
            const token = Cookies.get('auth_token');
            if (!token) return;

            if (isFollowing) {
                await axiosInstance.delete(`/users/${username}/unfollow`);
                setProfile(prev => prev ? {
                    ...prev,
                    followers_count: prev.followers_count - 1
                } : null);
            } else {
                await axiosInstance.post(`/users/${username}/follow`);
                setProfile(prev => prev ? {
                    ...prev,
                    followers_count: prev.followers_count + 1
                } : null);
            }

            setIsFollowing(!isFollowing);
        } catch (err) {
            console.error('Follow/unfollow failed:', err);
        }
    };

    const handleMessage = async () => {
        try {
            console.log('Attempting to message user:', params.username);
            // Create a new conversation by sending a message
            const response = await axios.post(`/users/${params.username}/messages`, {
                content: 'Hello!',
            });
            console.log('Message sent successfully:', response.data);
            // Redirect to messages page
            router.push('/messages');
        } catch (error: any) {
            console.error('Error starting conversation:', error);
            console.error('Error details:', error.response?.data);
            if (error.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to start conversation. Please try again.');
            }
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;
    if (error) return <div className="text-red-400">{error}</div>;

    return (
        <div className="w-full h-full flex flex-col items-center bg-main-gray text-white">
            <Header />
            <div className="w-[60%] h-56 mt-24 rounded-md bg-gray-700 flex justify-center items-center relative">
                {profile?.banner ? (
                    <img src={`${BACKEND_URL}${profile.banner}`} alt="Banner" className="w-full h-full rounded-md object-cover" />
                ) : (
                    <p className="text-gray-400">No banner uploaded</p>
                )}
                
            </div>


            <div className="w-[60%] -mt-10 flex justify-between items-start">
            <div className="min-w-40 min-h-40 mt-[5%] ml-[13%] rounded-full bg-gray-600 flex justify-center items-center border-4 border-gray-800 relative z-10 ">
                {profile?.profile_picture ? (
                    <img src={`${BACKEND_URL}${profile.profile_picture}`} alt="Profile" className="w-[200px] h-[200px] rounded-full object-cover" />
                ) : (
                    <p className="text-gray-300">No Image</p>
                )}
            </div>
                <div className="w-[45%] mt-[6%] -ml-[1%]">
                    <h1 className="text-3xl font-semibold">{profile?.username}</h1>
                    <div className="flex gap-4 mt-2 text-gray-400">
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

                <div className="flex gap-4">
                    <button
                        onClick={handleFollowToggle}
                        className={`px-6 py-2 rounded-lg ${
                            isFollowing
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : 'bg-main-red text-white hover:bg-red-700'
                        }`}
                    >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button
                        onClick={handleMessage}
                        className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                        Message
                    </button>
                </div>
            </div>

            <div className="w-full flex justify-end mt-16 mb-8">
                <div className="w-[40%] mr-[22%]">
                    <h2 className="text-2xl font-bold mb-4">{profile?.username}'s Posts</h2>
                    {profile?.posts && profile.posts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 auto-rows-[150px]">
                            {profile.posts.map((post) => {
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
                                                    <span key={tag.id} className="px-2 py-1 bg-gray-700 rounded-full text-xs">
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
                            <p>This user hasn't made any posts yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <UsersListModal
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
                username={username}
                type="followers"
            />

            <UsersListModal
                isOpen={showFollowingModal}
                onClose={() => setShowFollowingModal(false)}
                username={username}
                type="following"
            />
        </div>
    );
}
