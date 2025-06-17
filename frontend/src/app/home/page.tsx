'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { forumService, Forum, Post } from '@/services/forumService';
import { newsService, NewsArticle } from '@/services/newsService';
import Image from 'next/image';

const BACKEND_URL = 'http://localhost:8000';
const POSTS_PER_PAGE = 6;

export default function Home() {
  const router = useRouter();
  const [popularSlide, setPopularSlide] = useState(0);
  const [friendsSlide, setFriendsSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data using React Query with parallel loading
  const { data: newsData, isLoading: newsLoading } = useQuery<NewsArticle[]>({
    queryKey: ['latestNews'],
    queryFn: () => newsService.getLatestNews(3),
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  const { data: forumsData, isLoading: forumsLoading } = useQuery<Forum[]>({
    queryKey: ['topForums'],
    queryFn: () => forumService.getTopForums(),
    staleTime: 300000, // Consider data fresh for 5 minutes
  });

  const { data: postsData, isLoading: postsLoading } = useQuery<{ posts: Post[], hasMore: boolean }>({
    queryKey: ['popularPosts', currentPage],
    queryFn: () => forumService.getPopularPosts(currentPage, POSTS_PER_PAGE),
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  const { data: friendsPostsData, isLoading: friendsLoading } = useQuery<Post[]>({
    queryKey: ['friendsPosts'],
    queryFn: () => forumService.getFollowedUsersPosts(),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (type: 'popular' | 'friends') => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (type === 'popular') {
      if (isLeftSwipe) {
        nextPopularSlide();
      } else if (isRightSwipe) {
        prevPopularSlide();
      }
    } else {
      if (isLeftSwipe) {
        nextFriendsSlide();
      } else if (isRightSwipe) {
        prevFriendsSlide();
      }
    }
  };

  const loadMorePosts = () => {
    if (postsData?.hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const nextPopularSlide = () => {
    setPopularSlide((prev) => (prev + 1) % Math.ceil((postsData?.posts.length || 0) / 3));
  };

  const prevPopularSlide = () => {
    setPopularSlide((prev) => (prev - 1 + Math.ceil((postsData?.posts.length || 0) / 3)) % Math.ceil((postsData?.posts.length || 0) / 3));
  };

  const nextFriendsSlide = () => {
    setFriendsSlide((prev) => (prev + 1) % Math.ceil((friendsPostsData?.length || 0) / 3));
  };

  const prevFriendsSlide = () => {
    setFriendsSlide((prev) => (prev - 1 + Math.ceil((friendsPostsData?.length || 0) / 3)) % Math.ceil((friendsPostsData?.length || 0) / 3));
  };

  // Show loading state only for initial load
  const isLoading = newsLoading && forumsLoading && postsLoading && friendsLoading;

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

  return (
    <div className="min-h-screen bg-main-gray text-white">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Latest News Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <a 
              href="/news" 
              className="text-main-red mt-2 hover:text-red-400 transition-colors flex items-center gap-1 text-sm"
            >
              View All News
              <span>→</span>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsData?.map((article: NewsArticle) => (
              <div
                key={article.id}
                onClick={() => router.push(`/news/${article.id}`)}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors"
              >
                {article.image_url && (
                  <div className="aspect-w-16 aspect-h-9">
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      width={400}
                      height={300}
                      className="object-cover w-full h-48"
                      loading="lazy"
                      priority={false}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-main-red text-white rounded-full text-xs">
                      {article.category}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-3">{article.content}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                      {article.author.profile_picture ? (
                        <Image
                          src={`${BACKEND_URL}${article.author.profile_picture}`}
                          alt={article.author.username}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {article.author.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{article.author.username}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Friends Posts Section */}
        {friendsPostsData && friendsPostsData.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Posts from Friends</h2>
            <div className="relative">
              {/* Slider Container */}
              <div 
                className="overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={() => onTouchEnd('friends')}
              >
                <div 
                  className="flex transition-transform duration-1000 ease-in-out"
                  style={{ transform: `translateX(-${friendsSlide * 100}%)` }}
                >
                  {Array.from({ length: Math.ceil(friendsPostsData.length / 3) || 1 }).map((_, groupIndex) => (
                    <div key={groupIndex} className="min-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {friendsPostsData.slice(groupIndex * 3, (groupIndex + 1) * 3).map((post: Post) => {
                        const forumSlug = post.forum?.slug || post.forum_name;
                        const forumName = post.forum?.name || post.forum_name;
                        
                        return (
                          <div
                            key={post.id}
                            onClick={() => router.push(`/forums/${forumSlug}/posts/${post.id}`)}
                            className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-sm text-gray-400">by</span>
                              <span className="text-sm text-main-red">{post.user.username}</span>
                              <span className="text-sm text-gray-400">in</span>
                              <span className="text-sm text-main-red">{forumName}</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h3>
                            <p className="text-gray-400 mb-4 line-clamp-3">{post.content}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                </svg>
                                {post.likes}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                                </svg>
                                {post.dislikes}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                </svg>
                                {post.comment_count}
                              </span>
                              <span>•</span>
                              <span className="text-gray-400">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevFriendsSlide}
                className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-6 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors z-10 hidden sm:block"
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextFriendsSlide}
                className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-6 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors z-10 hidden sm:block"
                aria-label="Next slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Slide Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: Math.ceil(friendsPostsData.length / 3) || 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFriendsSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      friendsSlide === index ? 'bg-main-red' : 'bg-gray-600'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {forumsData?.map((forum: Forum) => (
              <div
                key={forum.id}
                onClick={() => router.push(`/forums/${forum.slug}`)}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="aspect-w-16 aspect-h-9">
                  {forum.image_url ? (
                    <Image
                      src={`${BACKEND_URL}${forum.image_url}`}
                      alt={forum.name}
                      width={400}
                      height={300}
                      className="object-cover w-full h-48"
                      loading="lazy"
                      priority={false}
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
        <div>
          <h2 className="text-2xl font-bold mb-6">Popular Posts</h2>
          <div className="relative">
            {/* Slider Container */}
            <div 
              className="overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => onTouchEnd('popular')}
            >
              <div 
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${popularSlide * 100}%)` }}
              >
                {Array.from({ length: Math.ceil((postsData?.posts.length || 0) / 3) }).map((_, groupIndex) => (
                  <div key={groupIndex} className="min-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postsData?.posts.slice(groupIndex * 3, (groupIndex + 1) * 3).map((post: Post) => (
                      <div
                        key={post.id}
                        onClick={() => router.push(`/forums/${post.forum?.slug || ''}/posts/${post.id}`)}
                        className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-400">in</span>
                          <span className="text-sm text-main-red">{post.forum?.name || 'Unknown Forum'}</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-gray-400 mb-4 line-clamp-3">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                            {post.likes}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                            </svg>
                            {post.dislikes}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                            {post.comment_count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevPopularSlide}
              className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-6 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors z-10 hidden sm:block"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextPopularSlide}
              className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-6 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors z-10 hidden sm:block"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil((postsData?.posts.length || 0) / 3) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPopularSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    popularSlide === index ? 'bg-main-red' : 'bg-gray-600'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
