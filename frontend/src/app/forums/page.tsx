'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Forum } from '@/services/forumService';
import axios from '@/services/auth';
import { AxiosError } from 'axios';

export default function ForumsPage() {
    const router = useRouter();
    const [forums, setForums] = useState<Forum[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newForum, setNewForum] = useState({
        name: '',
        description: '',
        image: null as File | null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthAndLoadForums();
    }, []);

    const checkAuthAndLoadForums = async () => {
        try {
            // First check authentication
            await axios.get('/profile');
            setIsAuthenticated(true);
            // If authenticated, load forums
            await loadForums();
        } catch (error: any) {
            console.error('Authentication error:', error);
            if (error instanceof AxiosError && error.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to verify authentication. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadForums = async () => {
        try {
            setError(null);
            const data = await forumService.getForums();
            setForums(data);
        } catch (error: any) {
            console.error('Error loading forums:', error);
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    router.push('/login');
                } else {
                    setError('Failed to load forums. Please try again later.');
                }
            } else {
                setError('An unexpected error occurred. Please try again later.');
            }
        }
    };

    const handleCreateForum = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            await forumService.createForum({
                name: newForum.name,
                description: newForum.description,
                image: newForum.image || undefined,
            });
            setIsCreateModalOpen(false);
            setNewForum({ name: '', description: '', image: null });
            loadForums();
        } catch (error: any) {
            console.error('Error creating forum:', error);
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    router.push('/login');
                } else {
                    setError('Failed to create forum. Please try again later.');
                }
            } else {
                setError('An unexpected error occurred. Please try again later.');
            }
        }
    };

    const filteredForums = forums.filter(forum =>
        forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        forum.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
    }

    return (
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-8 mt-20">
                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
                        {error}
                    </div>
                )}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Game Forums</h1>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-main-red hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    >
                        Create New Forum
                    </button>
                </div>

                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search forums..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-main-red"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForums.map((forum) => (
                        <div
                            key={forum.id}
                            onClick={() => router.push(`/forums/${forum.slug}`)}
                            className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <div className="aspect-w-16 aspect-h-9">
                                {forum.image_url ? (
                                    <img
                                        src={`http://127.0.0.1:8000${forum.image_url}`}
                                        alt={forum.name}
                                        className="object-cover w-full h-full"
                                        onError={(e) => console.error('Image failed to load:', e)}
                                        onLoad={() => console.log('Image loaded successfully:', `http://127.0.0.1:8000${forum.image_url}`)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                        <span className="text-4xl">🎮</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">{forum.name}</h2>
                                <p className="text-gray-400 mb-4">{forum.description}</p>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>{forum.member_count} members</span>
                                    <span>{forum.post_count} posts</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Create New Forum</h2>
                            <form onSubmit={handleCreateForum}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={newForum.name}
                                        onChange={(e) => setNewForum({ ...newForum, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea
                                        value={newForum.description}
                                        onChange={(e) => setNewForum({ ...newForum, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNewForum({ ...newForum, image: e.target.files?.[0] || null })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-main-red"
                                    />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-main-red hover:bg-red-700 rounded-lg"
                                    >
                                        Create Forum
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 