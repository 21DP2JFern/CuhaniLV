'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Cookies from 'js-cookie';

// Define the profile structure
interface Profile {
    username: string;
    bio?: string;
    profile_picture?: string;
    banner?: string;
}

export default function Profile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

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
                setProfile(response.data.user);
            } catch (err: any) {
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

    // Show a loading indicator while fetching
    if (loading) {
        return <div className="text-center text-white mt-10">Loading profile...</div>;
    }

    // Show error message if authentication fails
    if (error) {
        return (
            <div className="text-center text-red-500 mt-10">
                {error}
                <button onClick={() => router.push('/')} className="ml-4 text-blue-400 underline">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center bg-gray-900 text-white">
            {/* Profile Banner */}
            <div className="w-full h-56 bg-gray-700 flex justify-center items-center relative">
                {profile?.banner ? (
                    <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                    <p className="text-gray-400">No banner uploaded</p>
                )}
            </div>

            {/* Profile Picture */}
            <div className="w-40 h-40 rounded-full bg-gray-600 -mt-16 flex justify-center items-center border-4 border-gray-800">
                {profile?.profile_picture ? (
                    <img src={profile.profile_picture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <p className="text-gray-300">No Image</p>
                )}
            </div>

            {/* Username & Bio */}
            <div className="mt-4 text-center">
                <h1 className="text-3xl font-semibold">{profile?.username ?? 'Unknown User'}</h1>
                <p className="text-gray-400 mt-2">{profile?.bio ?? 'No bio available'}</p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex space-x-4">
                <button 
                    className="px-6 py-2 bg-red-500 hover:bg-red-700 rounded-md text-white"
                    onClick={() => router.push('/edit-profile')}
                >
                    Edit Profile
                </button>

                <button 
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-800 rounded-md text-white"
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
                    Logout
                </button>
            </div>
        </div>
    );
}
