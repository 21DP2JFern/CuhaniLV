'use client'
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Cookies from 'js-cookie';
import Header from '@/components/Header';

interface Profile {
    username: string;
    bio?: string;
    profile_picture?: string;
    banner?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const BACKEND_URL = 'http://localhost:8000';

export default function EditProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [banner, setBanner] = useState<File | null>(null);
    const [previewProfilePicture, setPreviewProfilePicture] = useState<string>('');
    const [previewBanner, setPreviewBanner] = useState<string>('');
    const router = useRouter();
    const pathname = usePathname();

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
                console.log('Profile data:', response.data.user); // Debug log
                setProfile(response.data.user);
                setUsername(response.data.user.username || '');
                setBio(response.data.user.bio || '');
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

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions while maintaining aspect ratio
                    const maxDimension = 1200; // Max width/height
                    if (width > height && width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob with reduced quality
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Could not create blob'));
                                return;
                            }
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        0.7 // Quality (0.7 = 70% quality)
                    );
                };
                img.onerror = () => reject(new Error('Failed to load image'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
        });
    };

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Please upload a valid image file (JPEG, PNG, or GIF)';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'File size must be less than 5MB';
        }
        return null;
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
            try {
                const compressedFile = await compressImage(file);
                setProfilePicture(compressedFile);
                setPreviewProfilePicture(URL.createObjectURL(compressedFile));
                setError(null);
            } catch (err) {
                setError('Failed to process image. Please try again.');
            }
        }
    };

    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
            try {
                const compressedFile = await compressImage(file);
                setBanner(compressedFile);
                setPreviewBanner(URL.createObjectURL(compressedFile));
                setError(null);
            } catch (err) {
                setError('Failed to process image. Please try again.');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('bio', bio);
            
            if (profilePicture) {
                formData.append('profile_picture', profilePicture);
            }
            if (banner) {
                formData.append('banner', banner);
            }

            await axiosInstance.post('/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });

            router.push('/profile');
        } catch (err: any) {
            setError(err.response?.data?.message || "Error updating profile. Please try again.");
        }
    };

    if (loading) {
        return <div className="text-center text-white mt-10">Loading profile...</div>;
    }

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
            <form onSubmit={handleSubmit} className="w-full flex flex-col mt-16 items-center">
                {/* Profile Banner */}
                <div className="w-[60%] h-56 mt-10 rounded-md bg-gray-700 flex justify-center items-center relative">
                    {previewBanner ? (
                        <img src={previewBanner} alt="Banner" className="w-full h-full object-cover" />
                    ) : profile?.banner ? (
                        <img 
                            src={`${BACKEND_URL}${profile.banner}`} 
                            alt="Banner" 
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => console.error('Banner load error:', e)} 
                        />
                    ) : (
                        <p className="text-gray-400">No banner uploaded</p>
                    )}
                    {/* Gap in banner */}
                    <div className="absolute -bottom-16 left-[15%] w-40 h-40 bg-main-gray rounded-full border-4 border-gray-800"></div>
                    <label className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-50 p-2 rounded-md cursor-pointer hover:bg-opacity-70">
                        <span className="text-sm">Change Banner</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Profile Picture */}
                <div className="w-40 h-40 rounded-full bg-gray-600 -mt-24 flex justify-center items-center border-4 border-gray-800 relative z-10 -ml-[34.5%]">
                    {previewProfilePicture ? (
                        <img src={previewProfilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : profile?.profile_picture ? (
                        <img 
                            src={`${BACKEND_URL}${profile.profile_picture}`} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => console.error('Profile picture load error:', e)} 
                        />
                    ) : (
                        <p className="text-gray-300">No Image</p>
                    )}
                    <label className="absolute bottom-0 right-0 bg-gray-800 bg-opacity-50 p-2 rounded-full cursor-pointer hover:bg-opacity-70">
                        <span className="text-sm">Change</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Username & Bio */}
                <div className="-mt-12 -ml-[14%]">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-main-red"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-main-red w-64 h-24 resize-none"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="ml-[45%] -mt-14 flex space-x-4">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-main-red hover:bg-red-700 rounded-md text-white"
                    >
                        Save Changes
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/profile')}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-800 rounded-md text-white"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
} 