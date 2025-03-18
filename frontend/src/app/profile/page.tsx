'use client'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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
    const [loading, setLoading] = useState<boolean>(true); // ✅ Add loading state
    const router = useRouter();

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) {
                    setError("User is not authenticated.");
                    setLoading(false);
                    return;
                }

                const response = await axios.get<{ user: Profile }>('http://127.0.0.1:8000/api/profile', {
                    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json'},
                    withCredentials: true,
                });

                setProfile(response.data.user);
            } catch (err) {
                setError("Error fetching profile. Please try again.");
            } finally {
                setLoading(false); // ✅ Stop loading when request completes
            }
        };

        fetchProfile();
    }, []);

    // ✅ Show a loading indicator while fetching
    if (loading) {
        return <div className="text-center text-white mt-10">Loading profile...</div>;
    }

    // ✅ Show error message if authentication fails
    if (error) {
        return (
            <div className="text-center text-red-500 mt-10">
                {error}
                <button onClick={() => router.push('/login')} className="ml-4 text-blue-400 underline">
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
                    onClick={() => { localStorage.removeItem('userToken'); router.push('/'); }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
