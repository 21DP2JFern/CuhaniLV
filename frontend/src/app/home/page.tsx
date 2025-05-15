'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Forum, Post } from '@/services/forumService';

const BACKEND_URL = 'http://localhost:8000';

export default function Home() {
  const router = useRouter();
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [friendsPosts, setFriendsPosts] = useState<Post[]>([]);
  const [topForums, setTopForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [forumsLoading, setForumsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top forums
        const forums = await forumService.getTopForums();
        setTopForums(forums);
        setForumsLoading(false);

        // Get all forums for popular posts
        const allForums = await forumService.getForums();
        
        // Get posts from each forum and combine them
        const allPosts: Post[] = [];
        for (const forum of allForums) {
          const { posts } = await forumService.getForum(forum.slug);
          // Add forum name to each post
          const postsWithForum = posts.map(post => ({
            ...post,
            forum_name: forum.name
          }));
          allPosts.push(...postsWithForum);
        }
        
        // Sort posts by popularity (likes - dislikes) and get top 12 (4 pages of 3 posts each)
        const sortedPosts = allPosts
          .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
          .slice(0, 12);
        
        setPopularPosts(sortedPosts);
        setLoading(false);

        // Fetch friends posts
        const posts = await forumService.getFollowedUsersPosts();
        setFriendsPosts(posts);
        setFriendsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        setFriendsLoading(false);
        setForumsLoading(false);
      }
    };

    fetchData();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 4); // Always 4 pages
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 4) % 4); // Always 4 pages
  };

  if (loading || friendsLoading || forumsLoading) {
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
    <div className="min-h-screen bg-main-gray text-white">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Top Forums Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Top Forums</h2>
            <a 
              href="/forums" 
              className="text-main-red mt-2 hover:text-red-400 transition-colors flex items-center gap-1 text-sm"
            >
              Go to Forums
              <span>→</span>
            </a>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {topForums.map((forum) => (
              <div
                key={forum.id}
                onClick={() => router.push(`/forums/${forum.slug}`)}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="aspect-w-16 aspect-h-9">
                  {forum.image_url ? (
                    <img
                      src={`${BACKEND_URL}${forum.image_url}`}
                      alt={forum.name}
                      className="object-cover w-full h-48"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                      <span className="text-4xl">🎮</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{forum.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">{forum.description}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{forum.member_count} members</span>
                    <span>{forum.post_count} posts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Posts Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular Posts</h2>
          <div className="relative">
            {/* Slider Container */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: 4 }).map((_, groupIndex) => (
                  <div key={groupIndex} className="min-w-full grid grid-cols-3 gap-6">
                    {popularPosts.slice(groupIndex * 3, (groupIndex + 1) * 3).map((post) => (
                      <div
                        key={post.id}
                        onClick={() => router.push(`/forums/${post.forum.slug}/posts/${post.id}`)}
                        className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-400">in</span>
                          <span className="text-sm text-main-red">{post.forum_name}</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-gray-400 mb-4 line-clamp-3">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{post.likes} likes</span>
                          <span>•</span>
                          <span>{post.dislikes} dislikes</span>
                          <span>•</span>
                          <span>{post.comment_count} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-6 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors z-10"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-6 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors z-10"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentSlide === index ? 'bg-main-red' : 'bg-gray-600'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Friends Posts Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Posts from Friends</h2>
          <div className="grid grid-cols-3 gap-6">
            {friendsPosts.length > 0 ? (
              friendsPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/forums/${post.forum.slug}/posts/${post.id}`)}
                  className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400">in</span>
                    <span className="text-sm text-main-red">{post.forum_name}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-400 mb-4 line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{post.likes} likes</span>
                    <span>•</span>
                    <span>{post.dislikes} dislikes</span>
                    <span>•</span>
                    <span>{post.comment_count} comments</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3">
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <p>No posts from friends yet</p>
                  <p className="text-sm mt-2">Follow some users to see their posts here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
