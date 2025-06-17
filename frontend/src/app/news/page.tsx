'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import axios from '@/services/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

const BACKEND_URL = 'http://localhost:8000';

interface NewsArticle {
    id: number;
    title: string;
    content: string;
    category: string;
    image_url: string | null;
    created_at: string;
    author: {
        id: number;
        username: string;
        profile_picture: string | null;
    };
}

interface User {
    role: string;
}

const categories = [
    { id: 'gaming', name: 'Gaming' },
    { id: 'tech', name: 'Technology' },
    { id: 'esports', name: 'Esports' },
    { id: 'new-games', name: 'New Games' },
    { id: 'updates', name: 'Game Updates' },
    { id: 'reviews', name: 'Game Reviews' }
];

export default function NewsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newArticle, setNewArticle] = useState({
        title: '',
        content: '',
        category: 'gaming',
        image_url: ''
    });

    // Fetch user role
    const { data: userData } = useQuery<User>({
        queryKey: ['userRole'],
        queryFn: async () => {
            const response = await axios.get('/profile');
            return response.data.user;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const isAdmin = userData?.role === 'admin';

    // Fetch articles
    const {
        data: articles = [],
        isLoading,
        isError,
        error
    } = useQuery<NewsArticle[]>({
        queryKey: ['news'],
        queryFn: async () => {
            const response = await axios.get('/news');
            return response.data;
        },
        staleTime: 60 * 1000, // 1 minute
    });

    // Add article mutation
    const addArticleMutation = useMutation({
        mutationFn: async (article: typeof newArticle) => {
            const response = await axios.post('/news', article);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
            setIsAddModalOpen(false);
            setNewArticle({
                title: '',
                content: '',
                category: 'gaming',
                image_url: ''
            });
        },
        onError: (error: any) => {
            console.error('Error adding article:', error);
        }
    });

    // Delete article mutation
    const deleteArticleMutation = useMutation({
        mutationFn: async (articleId: number) => {
            await axios.delete(`/news/${articleId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
        onError: (error: any) => {
            console.error('Error deleting article:', error);
        }
    });

    const handleAddArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        addArticleMutation.mutate(newArticle);
    };

    const handleDeleteArticle = async (articleId: number) => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;
        deleteArticleMutation.mutate(articleId);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main-red"></div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="container mx-auto px-4 py-8 mt-[70px]">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Failed to load news</h1>
                        <button
                            onClick={() => router.push('/')}
                            className="text-blue-500 hover:text-blue-400"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredArticles = selectedCategory === 'all' 
        ? articles 
        : articles.filter(article => article.category === selectedCategory);

    return (
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-8 mt-[70px]">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Gaming News</h1>
                    {isAdmin && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-2 bg-main-red hover:bg-red-700 rounded-lg"
                        >
                            Add Article
                        </button>
                    )}
                </div>

                {/* Categories */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                            selectedCategory === 'all'
                                ? 'bg-main-red'
                                : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                                selectedCategory === category.id
                                    ? 'bg-main-red'
                                    : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                        <div
                            key={article.id}
                            onClick={() => router.push(`/news/${article.id}`)}
                            className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            {article.image_url && (
                                <div className="aspect-video relative">
                                    <Image
                                        src={article.image_url}
                                        alt={article.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            )}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-main-red text-white rounded-full text-xs">
                                        {categories.find(c => c.id === article.category)?.name}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h2 className="text-xl font-semibold mb-2 line-clamp-2">{article.title}</h2>
                                <p className="text-gray-400 line-clamp-3 mb-4">
                                    {article.content}
                                </p>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden mr-2 relative">
                                        {article.author.profile_picture ? (
                                            <Image
                                                src={`${BACKEND_URL}${article.author.profile_picture}`}
                                                alt={article.author.username}
                                                fill
                                                className="object-cover"
                                                sizes="32px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                                {article.author.username[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-300">{article.author.username}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredArticles.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                        <p>No articles found in this category.</p>
                    </div>
                )}
            </div>

            {/* Add Article Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                        <h2 className="text-2xl font-bold mb-4">Add New Article</h2>
                        <form onSubmit={handleAddArticle} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    type="text"
                                    value={newArticle.title}
                                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-red"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    value={newArticle.category}
                                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-red"
                                    required
                                >
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Content</label>
                                <textarea
                                    value={newArticle.content}
                                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-red h-32"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                                <input
                                    type="url"
                                    value={newArticle.image_url}
                                    onChange={(e) => setNewArticle({ ...newArticle, image_url: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-red"
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addArticleMutation.isPending}
                                    className="px-4 py-2 bg-main-red hover:bg-red-700 rounded-lg disabled:opacity-50"
                                >
                                    {addArticleMutation.isPending ? 'Adding...' : 'Add Article'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 