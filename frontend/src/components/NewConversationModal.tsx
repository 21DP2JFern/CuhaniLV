'use client'

import { useState, useEffect } from 'react';
import axios from '@/services/auth';

interface User {
    id: number;
    username: string;
    profile_picture: string | null;
}

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationStart: (userId: number) => void;
}

export default function NewConversationModal({ isOpen, onClose, onConversationStart }: NewConversationModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchFollowingUsers();
        }
    }, [isOpen]);

    const fetchFollowingUsers = async () => {
        try {
            setError(null);
            const response = await axios.get('/users/following');
            setUsers(response.data);
        } catch (error: any) {
            console.error('Error fetching following users:', error);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">New Conversation</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-900/20 rounded-lg text-main-red">
                        {error}
                    </div>
                )}

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main-red"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">
                            You are not following any users yet.
                        </p>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => {
                                    onConversationStart(user.id);
                                    onClose();
                                }}
                                className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                                    {user.profile_picture ? (
                                        <img
                                            src={`http://127.0.0.1:8000${user.profile_picture}`}
                                            alt={user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center text-sm text-gray-400 h-full">
                                            No Img
                                        </div>
                                    )}
                                </div>
                                <span className="text-lg font-medium">
                                    {user.username}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 