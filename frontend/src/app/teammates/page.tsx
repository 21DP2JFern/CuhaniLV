'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { userService, User } from '@/services/userService';

export default function UserSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Add debounce to prevent too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const users = await userService.searchUsers(query.trim());
            setResults(users);
        } catch (err: any) {
            console.error('Search error:', err);
            if (err.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to search users. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-16 mt-12">
                <h1 className="text-3xl font-bold mb-6">Search Users</h1>
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-main-red"
                    />
                </div>

                {error && (
                    <div className="text-main-red mb-4 p-4 bg-red-900/20 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid gap-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main-red"></div>
                        </div>
                    ) : results.length === 0 ? (
                        query.trim() ? (
                            <p className="text-gray-400 p-4 bg-gray-800/50 rounded-lg">
                                No users found matching "{query}"
                            </p>
                        ) : (
                            <p className="text-gray-400 p-4 bg-gray-800/50 rounded-lg">
                                Enter a username to search
                            </p>
                        )
                    ) : (
                        results.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => router.push(`/users/${user.username}`)}
                                className="flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors group"
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
                                <div className="flex-1">
                                    <span className="text-lg font-medium group-hover:text-main-red transition-colors">
                                        {user.username}
                                    </span>
                                    {user.bio && (
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                            {user.bio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}