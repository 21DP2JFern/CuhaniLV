'use client'

import { useState } from 'react';
import { userService, User } from '../services/userService';
import { useQuery } from '@tanstack/react-query';

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationStart: (username: string) => void;
}

export default function NewConversationModal({ isOpen, onClose, onConversationStart }: NewConversationModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch users with search
    const {
        data: searchResults = [],
        isLoading,
        isError,
        error
    } = useQuery<User[]>({
        queryKey: ['users', 'search', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            return userService.searchUsers(searchQuery.trim());
        },
        enabled: searchQuery.trim().length > 0,
        staleTime: 30000, // 30 seconds
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">New Conversation</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
                    />
                </div>

                {isError && (
                    <div className="text-main-red mb-4 p-4 bg-red-900/20 rounded-lg">
                        {error instanceof Error ? error.message : 'Failed to search users. Please try again.'}
                    </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main-red"></div>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">
                            {searchQuery.trim() ? 'No users found' : 'Enter a username to search'}
                        </p>
                    ) : (
                        searchResults.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => onConversationStart(user.username)}
                                className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
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
                                <span className="font-medium">{user.username}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 