'use client'

import { useRouter } from 'next/navigation';
import axios from '@/services/auth';
import { useQuery } from '@tanstack/react-query';

interface User {
    id: number;
    username: string;
    profile_picture?: string;
}

interface UsersListModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    type: 'followers' | 'following';
}

const BACKEND_URL = 'http://localhost:8000';

export default function UsersListModal({ isOpen, onClose, username, type }: UsersListModalProps) {
    const router = useRouter();

    // Fetch users list
    const {
        data: users = [],
        isLoading,
        isError,
        error
    } = useQuery<User[]>({
        queryKey: ['users', username, type],
        queryFn: async () => {
            const response = await axios.get(`/users/${username}/${type}`);
            return response.data;
        },
        enabled: isOpen,
        staleTime: 60000, // 1 minute
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg w-[400px] max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold capitalize">{type}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main-red"></div>
                        </div>
                    ) : isError ? (
                        <div className="text-center text-main-red py-8">
                            {error instanceof Error ? error.message : 'Failed to load users. Please try again.'}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            No {type} found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        router.push(`/users/${user.username}`);
                                        onClose();
                                    }}
                                    className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
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
                                    <span className="font-medium hover:text-main-red transition-colors">
                                        {user.username}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 