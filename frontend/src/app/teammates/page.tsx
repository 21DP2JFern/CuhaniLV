'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { userService, User } from '@/services/userService';
import { forumService, Forum } from '@/services/forumService';

export default function UserSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableGames, setAvailableGames] = useState<Forum[]>([]);
    const [selectedGame, setSelectedGame] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();

    const USERS_PER_PAGE = 15; // 5 users per row * 3 rows

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const games = await forumService.getForums();
                setAvailableGames(games);
            } catch (err) {
                console.error('Error fetching games:', err);
            }
        };

        fetchGames();
    }, []);

    // Add debounce to prevent too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim() || selectedGame) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, selectedGame]);

    const handleSearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const users = await userService.searchUsers(query.trim(), selectedGame);
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

    // Calculate pagination
    const totalPages = Math.ceil(results.length / USERS_PER_PAGE);
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    const currentUsers = results.slice(startIndex, endIndex);

    return (
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-16 mt-12">
                <h1 className="text-3xl font-bold mb-6">Find Teammates</h1>
                <div className="flex gap-4 mb-8">
                    <div className="w-1/2">
                        <input
                            type="text"
                            placeholder="Search by username..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setCurrentPage(1); // Reset to first page on new search
                            }}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-main-red"
                        />
                    </div>
                    <div className="w-1/2">
                        <select
                            value={selectedGame || ''}
                            onChange={(e) => {
                                setSelectedGame(e.target.value ? Number(e.target.value) : null);
                                setCurrentPage(1); // Reset to first page on new filter
                            }}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-main-red"
                        >
                            <option value="">Select a game</option>
                            {availableGames.map((game) => (
                                <option key={game.id} value={game.id}>
                                    {game.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="text-main-red mb-4 p-4 bg-red-900/20 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main-red"></div>
                    </div>
                ) : results.length === 0 ? (
                    (query.trim() || selectedGame) ? (
                        <p className="text-gray-400 p-4 bg-gray-800/50 rounded-lg">
                            No users found matching your criteria
                        </p>
                    ) : (
                        <p className="text-gray-400 p-4 bg-gray-800/50 rounded-lg">
                            Enter a username or select a game to search
                        </p>
                    )
                ) : (
                    <>
                        <div className="grid grid-cols-5 gap-4 mb-6 mt-36">
                            {currentUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => router.push(`/users/${user.username}`)}
                                    className="bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors p-3 flex flex-col relative"
                                >
                                    {/* Profile Picture Container */}
                                    <div className="w-44 h-44 rounded-full bg-gray-700 overflow-hidden border-4 border-gray-800 absolute -top-20 left-1/2 transform -translate-x-1/2">
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

                                    {/* Content Container */}
                                    <div className="mt-24 text-center">
                                        <h3 className="font-medium text-lg mb-1 truncate">
                                            {user.username}
                                        </h3>
                                        {user.bio && (
                                            <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                                {user.bio}
                                            </p>
                                        )}
                                        {user.games && user.games.length > 0 && (
                                            <div className="mt-2">
                                                <h4 className="text-sm text-gray-400 mb-1">Games</h4>
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {user.games.map((game) => (
                                                        <span
                                                            key={game.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/forums/${game.slug}`);
                                                            }}
                                                            className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded-full text-xs cursor-pointer transition-colors"
                                                            title={game.name}
                                                        >
                                                            {game.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center gap-2 mt-6">
                            {totalPages > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-4 py-2 rounded-lg ${
                                                currentPage === page
                                                    ? 'bg-main-red'
                                                    : 'bg-gray-800 hover:bg-gray-700'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                                    >
                                        Next
                                    </button>
                                </>
                            )}
                            <div className="ml-4 px-4 py-2 bg-gray-800 rounded-lg">
                                Page {currentPage} of {Math.max(totalPages, 1)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}