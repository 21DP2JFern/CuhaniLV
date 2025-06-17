'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import axios from '@/services/auth';
import NewConversationModal from '@/components/NewConversationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Conversation {
    id: number;
    other_user: {
        id: number;
        username: string;
        profile_picture: string | null;
    };
    last_message: {
        content: string;
        created_at: string;
    } | null;
    unread_count: number;
}

interface Message {
    id: number;
    content: string;
    created_at: string;
    user: {
        id: number;
        username: string;
        profile_picture: string | null;
    };
}

export default function MessagesPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

    // Fetch conversations
    const {
        data: conversations = [],
        isLoading: isLoadingConversations,
        isError: isErrorConversations,
        error: conversationsError
    } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: async () => {
            const response = await axios.get('/conversations');
            return response.data;
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Fetch messages for selected conversation
    const {
        data: messages = [],
        isLoading: isLoadingMessages,
        isError: isErrorMessages,
        error: messagesError
    } = useQuery<Message[]>({
        queryKey: ['messages', selectedConversation?.id],
        queryFn: async () => {
            if (!selectedConversation) return [];
            const response = await axios.get(`/conversations/${selectedConversation.id}/messages`);
            return response.data;
        },
        enabled: !!selectedConversation,
        staleTime: 10000, // 10 seconds
        refetchInterval: 10000, // Refetch every 10 seconds
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ content, username }: { content: string; username: string }) => {
            await axios.post(`/users/${username}/messages`, { content });
        },
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error: any) => {
            if (error.response?.status === 401) {
                router.push('/login');
            }
        },
    });

    // Start new conversation mutation
    const startConversationMutation = useMutation({
        mutationFn: async (username: string) => {
            await axios.post(`/users/${username}/messages`, { content: 'Hello!' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            setIsNewConversationModalOpen(false);
        },
        onError: (error: any) => {
            if (error.response?.status === 401) {
                router.push('/login');
            }
        },
    });

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        sendMessageMutation.mutate({
            content: newMessage,
            username: selectedConversation.other_user.username,
        });
    };

    const handleStartConversation = async (username: string) => {
        startConversationMutation.mutate(username);
    };

    if (isLoadingConversations) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main-red"></div>
                </div>
            </div>
        );
    }

    const error = isErrorConversations ? conversationsError : isErrorMessages ? messagesError : null;

    return (
        <div className="min-h-screen overflow-y-hidden bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-8 mt-[70px]">
                {error && (
                    <div className="mb-4 p-4 bg-red-900/20 rounded-lg text-main-red">
                        {error instanceof Error ? error.message : 'An error occurred. Please try again.'}
                    </div>
                )}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Messages</h2>
                    <button
                        onClick={() => setIsNewConversationModalOpen(true)}
                        className="px-6 py-2 bg-main-red hover:bg-red-700 rounded-lg"
                    >
                        New Conversation
                    </button>
                </div>
                <div className="flex h-[calc(100vh-12rem)] flex-col md:flex-row">
                    {/* Conversations List */}
                    <div className={`w-full md:w-1/3 border-r bg-gray-800 border-gray-700 p-4 rounded-lg ${
                        selectedConversation ? 'hidden md:block' : 'block'
                    }`}>
                        <div className="space-y-4">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                                        selectedConversation?.id === conversation.id
                                            ? 'bg-gray-700'
                                            : 'bg-gray-800 hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                                        {conversation.other_user.profile_picture ? (
                                            <img
                                                src={`http://127.0.0.1:8000${conversation.other_user.profile_picture}`}
                                                alt={conversation.other_user.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center text-sm text-gray-400 h-full">
                                                No Img
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium truncate">
                                                {conversation.other_user.username}
                                            </h3>
                                            {conversation.unread_count > 0 && (
                                                <span className="bg-main-red text-white text-xs px-2 py-1 rounded-full">
                                                    {conversation.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 truncate">
                                            {conversation.last_message?.content || 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`w-full md:w-2/3 md:pl-4 flex flex-col ${
                        selectedConversation ? 'block' : 'hidden md:flex'
                    }`}>
                        {selectedConversation ? (
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <button 
                                        onClick={() => setSelectedConversation(null)}
                                        className="md:hidden p-2 hover:bg-gray-700 rounded-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                        </svg>
                                    </button>
                                    <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                                        {selectedConversation.other_user.profile_picture ? (
                                            <img
                                                src={`http://127.0.0.1:8000${selectedConversation.other_user.profile_picture}`}
                                                alt={selectedConversation.other_user.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center text-sm text-gray-400 h-full">
                                                No Img
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold">
                                        {selectedConversation.other_user.username}
                                    </h2>
                                </div>

                                {isLoadingMessages ? (
                                    <div className="flex-1 flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main-red"></div>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2 md:px-0">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${
                                                    message.user.id === selectedConversation.other_user.id
                                                        ? 'justify-start'
                                                        : 'justify-end'
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-lg ${
                                                        message.user.id === selectedConversation.other_user.id
                                                            ? 'bg-gray-700'
                                                            : 'bg-main-red'
                                                    }`}
                                                >
                                                    <p className="text-sm text-gray-300 mb-1">
                                                        {message.user.username}
                                                    </p>
                                                    <p className="text-white">{message.content}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(message.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-main-red"
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                        className="px-6 py-2 bg-main-red hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <NewConversationModal
                isOpen={isNewConversationModalOpen}
                onClose={() => setIsNewConversationModalOpen(false)}
                onConversationStart={handleStartConversation}
            />
        </div>
    );
} 