'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import axios from '@/services/auth';
import NewConversationModal from '@/components/NewConversationModal';

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
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    const fetchConversations = async () => {
        try {
            setError(null);
            const response = await axios.get('/conversations');
            setConversations(response.data);
        } catch (error: any) {
            console.error('Error fetching conversations:', error);
            if (error.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to load conversations. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: number) => {
        try {
            setError(null);
            const response = await axios.get(`/conversations/${conversationId}/messages`);
            setMessages(response.data);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            if (error.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to load messages. Please try again later.');
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            setError(null);
            await axios.post(`/users/${selectedConversation.other_user.username}/messages`, {
                content: newMessage,
            });
            setNewMessage('');
            fetchMessages(selectedConversation.id);
            fetchConversations(); // Refresh conversations to update last message
        } catch (error: any) {
            console.error('Error sending message:', error);
            if (error.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to send message. Please try again.');
            }
        }
    };

    const handleStartConversation = async (username: string) => {
        try {
            setError(null);
            // Create a new conversation by sending a message
            await axios.post(`/users/${username}/messages`, {
                content: 'Hello!',
            });
            // Refresh conversations
            fetchConversations();
            setIsNewConversationModalOpen(false);
        } catch (error: any) {
            console.error('Error starting conversation:', error);
            if (error.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to start conversation. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main-red"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-y-hidden bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-8 mt-[70px]">
                {error && (
                    <div className="mb-4 p-4 bg-red-900/20 rounded-lg text-main-red">
                        {error}
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
                <div className="flex h-[calc(100vh-12rem)]">
                    {/* Conversations List */}
                    <div className="w-1/3 border-r bg-gray-800 border-gray-700 p-4 rounded-lg">
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
                    <div className="w-2/3 pl-4 flex flex-col">
                        {selectedConversation ? (
                            <>
                                <div className="flex items-center gap-4 mb-6">
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
                                    <h2 className="text-2xl font-bold">
                                        {selectedConversation.other_user.username}
                                    </h2>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
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
                                                className={`max-w-[70%] p-4 rounded-lg ${
                                                    message.user.id === selectedConversation.other_user.id
                                                        ? 'bg-gray-700'
                                                        : 'bg-main-red'
                                                }`}
                                            >
                                                <p>{message.content}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(message.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSendMessage} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-main-red"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-main-red hover:bg-red-700 rounded-lg"
                                    >
                                        Send
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-400">Select a conversation to start chatting</p>
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