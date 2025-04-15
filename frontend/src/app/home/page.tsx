'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { forumService, Post } from '@/services/forumService';

export default function Home() {
  const router = useRouter();
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularPosts = async () => {
      try {
        // Get all forums
        const forums = await forumService.getForums();
        
        // Get posts from each forum and combine them
        const allPosts: Post[] = [];
        for (const forum of forums) {
          const { posts } = await forumService.getForum(forum.slug);
          // Add forum name to each post
          const postsWithForum = posts.map(post => ({
            ...post,
            forum_name: forum.name
          }));
          allPosts.push(...postsWithForum);
        }
        
        // Sort posts by popularity (likes - dislikes) and get top 6
        const sortedPosts = allPosts
          .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
          .slice(0, 6);
        
        setPopularPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching popular posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularPosts();
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center bg-main-gray text-white">
      <Header />
      <div className='flex flex-row w-[1536px] h-full mt-24'>
        {/* Popular Posts */}
        <div className="w-full lg:w-80">
          <div className="bg-gray-800 rounded-lg p-4 sticky top-24 h-[85%]">
            <h2 className="text-xl font-bold mb-4">Popular Posts</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto h-[calc(100%-3rem)]">
                {popularPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => router.push(`/forums/${post.forum_id}/posts/${post.id}`)}
                    className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs text-main-red mb-1">
                      <span>in</span>
                      <span className="font-semibold">{post.forum_name}</span>
                    </div>
                    <h3 className="text-sm font-semibold mb-1 line-clamp-1">{post.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                      <span>by {post.user.username}</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>❤️ {post.likes}</span>
                      <span>👎 {post.dislikes}</span>
                      <span>💬 {post.comment_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
