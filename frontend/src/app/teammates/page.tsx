'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { userService, User } from '@/services/userService';
import { forumService, Forum } from '@/services/forumService';
import { useQuery } from '@tanstack/react-query';

export default function UserSearchPage() {
    const [query, setQuery] = useState('');
    const [selectedGame, setSelectedGame] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();

    const USERS_PER_PAGE = 15; // 5 users per row * 3 rows

    // Fetch available games
    const { data: gamesData } = useQuery({
        queryKey: ['games'],
        queryFn: async () => {
            const response = await forumService.getForums();
            return response.forums;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch users with search
    const { data: usersData, isLoading, isError, error } = useQuery({
        queryKey: ['users', query, selectedGame],
        queryFn: async () => {
            if (!query.trim() && !selectedGame) return [];
            return userService.searchUsers(query.trim(), selectedGame);
        },
        staleTime: 60000, // 1 minute
        enabled: query.trim().length > 0 || selectedGame !== null,
    });

    // Calculate pagination
    const totalPages = Math.ceil((usersData?.length || 0) / USERS_PER_PAGE);
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    const currentUsers = usersData?.slice(startIndex, endIndex) || [];

    // Ensure availableGames is an array before mapping
    const gameOptions = Array.isArray(gamesData) ? gamesData.map((game) => (
        <option key={game.id} value={game.id}>
            {game.name}
        </option>
    )) : [];

    return (
        <div className="min-h-screen bg-main-gray text-white">
            <Header />
            <div className="container mx-auto px-4 py-8 md:py-16 mt-12">
                <h1 className="text-2xl md:text-3xl font-bold mb-6">Find Teammates</h1>
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="w-full md:w-1/2">
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
                    <div className="w-full md:w-1/2">
                        <select
                            value={selectedGame || ''}
                            onChange={(e) => {
                                setSelectedGame(e.target.value ? Number(e.target.value) : null);
                                setCurrentPage(1); // Reset to first page on new filter
                            }}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-main-red"
                        >
                            <option value="">Select a game</option>
                            {gameOptions}
                        </select>
                    </div>
                </div>

                {isError && (
                    <div className="text-main-red mb-4 p-4 bg-red-900/20 rounded-lg">
                        {error instanceof Error ? error.message : 'Failed to search users. Please try again.'}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main-red"></div>
                    </div>
                ) : usersData?.length === 0 ? (
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6 mt-24 md:mt-36">
                            {currentUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => router.push(`/users/${user.username}`)}
                                    className="bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors p-3 flex flex-col relative"
                                >
                                    {/* Profile Picture Container */}
                                    <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-gray-700 overflow-hidden border-4 border-gray-800 absolute -top-16 md:-top-20 left-1/2 transform -translate-x-1/2">
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
                                    <div className="mt-20 md:mt-24 text-center">
                                        <h3 className="font-medium text-base md:text-lg mb-1 truncate">
                                            {user.username}
                                        </h3>
                                        {user.bio && (
                                            <p className="text-xs md:text-sm text-gray-400 line-clamp-2 mb-2">
                                                {user.bio}
                                            </p>
                                        )}
                                        {user.games && user.games.length > 0 && (
                                            <div className="mt-2">
                                                <h4 className="text-xs md:text-sm text-gray-400 mb-1">Games</h4>
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
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                            {totalPages > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 md:px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-sm md:text-base"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base ${
                                                    currentPage === page
                                                        ? 'bg-main-red'
                                                        : 'bg-gray-800 hover:bg-gray-700'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 md:px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-sm md:text-base"
                                    >
                                        Next
                                    </button>
                                </>
                            )}
                            <div className="w-full md:w-auto mt-2 md:mt-0 md:ml-4 px-3 md:px-4 py-2 bg-gray-800 rounded-lg text-sm md:text-base text-center">
                                Page {currentPage} of {Math.max(totalPages, 1)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}