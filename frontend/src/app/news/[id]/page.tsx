'use client'
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Header from '@/components/Header';

const BACKEND_URL = 'http://localhost:8000';

interface NewsArticle {
    id: number;
    title: string;
    content: string;
    category: string;
    image_url?: string;
    created_at: string;
    author: {
        id: number;
        username: string;
        profile_picture?: string;
    };
}

const categories = [
    { id: 'gaming', name: 'Gaming' },
    { id: 'tech', name: 'Technology' },
    { id: 'esports', name: 'Esports' },
    { id: 'new-games', name: 'New Games' },
    { id: 'updates', name: 'Game Updates' },
    { id: 'reviews', name: 'Game Reviews' }
];

export default function NewsArticle({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [article, setArticle] = useState<NewsArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editedArticle, setEditedArticle] = useState<Partial<NewsArticle>>({});
    const router = useRouter();

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const [articleResponse, profileResponse] = await Promise.all([
                    axiosInstance.get(`/news/${resolvedParams.id}`),
                    axiosInstance.get('/profile')
                ]);
                setArticle(articleResponse.data);
                setEditedArticle(articleResponse.data);
                setIsAdmin(profileResponse.data.user.role === 'admin');
            } catch (err: any) {
                console.error('Error fetching article:', err);
                setError('Failed to load article. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [resolvedParams.id]);

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.put(`/news/${resolvedParams.id}`, editedArticle);
            setArticle(response.data);
            setIsEditModalOpen(false);
        } catch (err: any) {
            console.error('Error updating article:', err);
            setError('Failed to update article. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;
        
        try {
            await axiosInstance.delete(`/news/${resolvedParams.id}`);
            router.push('/news');
        } catch (err: any) {
            console.error('Error deleting article:', err);
            setError('Failed to delete article. Please try again.');
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

    if (error || !article) {
        return (
            <div className="min-h-screen bg-main-gray text-white">
                <Header />
                <div className="container mx-auto px-4 py-8 mt-20">
                    <div className="text-center text-red-500">
                        {error || 'Article not found'}
                        <button onClick={() => router.push('/news')} className="ml-4 text-blue-400 underline">
                            Back to News
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-8 mt-20">
                {/* Back Button and Admin Actions */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => router.push('/news')}
                        className="flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to News
                    </button>
                    {isAdmin && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-4 py-2 bg-main-red hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Edit Article
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-lg transition-colors"
                            >
                                Delete Article
                            </button>
                        </div>
                    )}
                </div>

                {/* Article Content */}
                <article className="max-w-4xl mx-auto">
                    {/* Category Badge */}
                    <div className="mb-4">
                        <span className="px-3 py-1 bg-main-red text-white rounded-full text-sm">
                            {categories.find(c => c.id === article.category)?.name || article.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-6">{article.title}</h1>

                    {/* Author Info */}
                    <div className="flex items-center mb-8">
                        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden mr-3">
                            {article.author.profile_picture ? (
                                <img
                                    src={`${BACKEND_URL}${article.author.profile_picture}`}
                                    alt={article.author.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    {article.author.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-300">{article.author.username}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(article.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {article.image_url && (
                        <div className="mb-8 rounded-lg overflow-hidden">
                            <img
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-invert max-w-none">
                        {article.content.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-4 text-gray-300 leading-relaxed">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </article>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                        <h2 className="text-2xl font-bold mb-4">Edit Article</h2>
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    type="text"
                                    value={editedArticle.title}
                                    onChange={(e) => setEditedArticle({ ...editedArticle, title: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-red"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    value={editedArticle.category}
                                    onChange={(e) => setEditedArticle({ ...editedArticle, category: e.target.value })}
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
                                    value={editedArticle.content}
                                    onChange={(e) => setEditedArticle({ ...editedArticle, content: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-red h-32"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                                <input
                                    type="url"
                                    value={editedArticle.image_url}
                                    onChange={(e) => setEditedArticle({ ...editedArticle, image_url: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-red"
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-main-red hover:bg-red-700 rounded-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 