'use client'
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Header from '@/components/Header';
import axios from '@/services/auth';
import UsersListModal from '@/components/UsersListModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

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
    const queryClient = useQueryClient();

    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);

    // Fetch profile data using React Query
    const {
        data: profileData,
        isLoading,
        isError,
        error
    } = useQuery<{ user: Profile; is_following: boolean }>({
        queryKey: ['profile', username],
        queryFn: async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push('/');
                throw new Error('No auth token');
            }
            const res = await axiosInstance.get(`/users/${username}`);
            return res.data;
        },
        staleTime: 60000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
    });

    // Follow/Unfollow mutation
    const followMutation = useMutation({
        mutationFn: async (isFollowing: boolean) => {
            if (isFollowing) {
                await axiosInstance.delete(`/users/${username}/unfollow`);
            } else {
                await axiosInstance.post(`/users/${username}/follow`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', username] });
        },
        onError: (err) => {
            console.error('Follow/unfollow failed:', err);
        },
    });

    // Message mutation
    const messageMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post(`/users/${username}/messages`, {
                content: 'Hello!',
            });
            return response.data;
        },
        onSuccess: () => {
            router.push('/messages');
        },
        onError: (error: any) => {
            if (error.response?.status === 401) {
                router.push('/login');
            }
        },
    });

    const handleFollowToggle = () => {
        if (!profileData) return;
        followMutation.mutate(profileData.is_following);
    };

    const handleMessage = () => {
        messageMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main-red"></div>
                </div>
            </div>
        );
    }

    if (isError || !profileData) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Failed to load profile</h1>
                        <button
                            onClick={() => router.push('/')}
                            className="text-blue-500 hover:text-blue-400"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { user: profile, is_following } = profileData;

    return (
        <div className="w-full h-full flex flex-col items-center bg-main-gray text-white">
            <Header />
            <div className="w-[60%] h-56 mt-24 rounded-md bg-gray-700 flex justify-center items-center relative overflow-hidden">
                {profile.banner ? (
                    <Image
                        src={`${BACKEND_URL}${profile.banner}`}
                        alt="Banner"
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 60vw"
                    />
                ) : (
                    <p className="text-gray-400">No banner uploaded</p>
                )}
            </div>

            <div className="w-[60%] -mt-10 flex justify-between items-start relative">
                <div className="min-w-40 min-h-40 mt-[5%] rounded-full bg-gray-600 flex justify-center items-center border-4 border-gray-800 relative z-10 overflow-hidden">
                    {profile.profile_picture ? (
                        <Image
                            src={`${BACKEND_URL}${profile.profile_picture}`}
                            alt="Profile"
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 200px, 200px"
                        />
                    ) : (
                        <p className="text-gray-300">No Image</p>
                    )}
                </div>
                <div className="w-[45%] mt-[6%]">
                    <h1 className="text-3xl font-semibold">{profile.username}</h1>
                    <div className="flex gap-4 mt-2 text-gray-400">
                        <button 
                            onClick={() => setShowFollowersModal(true)}
                            className="hover:text-white transition-colors"
                        >
                            {profile.followers_count} Followers
                        </button>
                        <span>•</span>
                        <button 
                            onClick={() => setShowFollowingModal(true)}
                            className="hover:text-white transition-colors"
                        >
                            {profile.following_count} Following
                        </button>
                    </div>
                    <p className="text-gray-400 mt-2 break-words whitespace-pre-wrap">{profile.bio ?? 'No bio available'}</p>
                    
                    {profile.games && profile.games.length > 0 && (
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

                <div className="flex gap-4 mt-[6%]">
                    <button
                        onClick={handleFollowToggle}
                        disabled={followMutation.isPending}
                        className={`px-6 py-2 rounded-lg ${
                            is_following
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : 'bg-main-red text-white hover:bg-red-700'
                        }`}
                    >
                        {followMutation.isPending ? 'Loading...' : is_following ? 'Unfollow' : 'Follow'}
                    </button>
                    <button
                        onClick={handleMessage}
                        disabled={messageMutation.isPending}
                        className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                        {messageMutation.isPending ? 'Loading...' : 'Message'}
                    </button>
                </div>
            </div>

            <div className="w-[60%] mt-16 mb-8">
                <h2 className="text-2xl font-bold mb-4">{profile.username}'s Posts</h2>
                {profile.posts && profile.posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.posts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => router.push(`/forums/${post.forum.slug}/posts/${post.id}`)}
                                className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors relative flex flex-col overflow-y-visible"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-400">in</span>
                                    <span className="text-sm text-main-red">{post.forum.name}</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                                <p className="text-gray-400 mb-4 flex-grow whitespace-normal">{post.content}</p>
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
                                            <span key={tag.id} className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                                                {tag.tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        <p>This user hasn't made any posts yet.</p>
                    </div>
                )}
            </div>

            <UsersListModal
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
                username={profile.username}
                type="followers"
            />

            <UsersListModal
                isOpen={showFollowingModal}
                onClose={() => setShowFollowingModal(false)}
                username={profile.username}
                type="following"
            />
        </div>
    );
}
