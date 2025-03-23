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
}

const BACKEND_URL = 'http://localhost:8000';

export default function Profile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
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
        <div className="w-full h-full flex flex-col items-center bg-main-gray text-white">
            <Header />
            {/* Profile Banner */}
            <div className="w-[60%] h-56 mt-10 rounded-md bg-gray-700 flex justify-center items-center relative">
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
                    <img src={`${BACKEND_URL}${profile.profile_picture}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <p className="text-gray-300">No Image</p>
                )}
            </div>

            {/* Username & Bio */}
            <div className="-mt-12 w-[30%] h-[20%] ml-[5%]">
                <h1 className="text-3xl font-semibold">{profile?.username ?? 'Unknown User'}</h1>
                <p className="text-gray-400 mt-2">{profile?.bio ?? 'No bio available'}</p>
            </div>

            {/* Buttons */}
            <div className="ml-[45%] -mt-[9.5%] flex space-x-4">
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
    );
}
