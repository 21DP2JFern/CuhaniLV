import axios from './auth';

const API_URL = 'http://127.0.0.1:8000/api';

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

export interface Forum {
    id: number;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    member_count: number;
    post_count: number;
    is_member?: boolean;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: number;
    title: string;
    content: string;
    user_id: number;
    user: {
        id: number;
        username: string;
        profile_picture: string | null;
    };
    forum?: {
        id: number;
        slug: string;
        name: string;
    };
    forum_id?: number;
    forum_name?: string;
    likes: number;
    dislikes: number;
    comment_count: number;
    created_at: string;
    is_liked?: boolean;
    is_disliked?: boolean;
    is_saved?: boolean;
    tags?: {
        id: number;
        post_id: number;
        tag: string;
        created_at: string;
        updated_at: string;
    }[];
    comments?: Comment[];
}

export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    parent_id: number | null;
    content: string;
    likes: number;
    dislikes: number;
    is_liked: boolean;
    is_disliked: boolean;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        username: string;
        avatar_url: string | null;
    };
    replies: Comment[];
}

export const forumService = {
    // Get all forums
    getForums: async (): Promise<Forum[]> => {
        const response = await axios.get(`${API_URL}/forums`);
        return response.data.forums;
    },

    // Get top forums by member count
    getTopForums: async (): Promise<Forum[]> => {
        const response = await axios.get(`${API_URL}/forums/top`);
        return response.data.forums;
    },

    // Create a new forum
    createForum: async (data: { name: string; description: string; image?: File }): Promise<Forum> => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        if (data.image) {
            formData.append('image', data.image);
        }

        const response = await axios.post(`${API_URL}/forums`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        });
        return response.data.forum;
    },

    // Get a specific forum by slug
    getForum: async (slug: string): Promise<{ forum: Forum; posts: Post[] }> => {
        const response = await axios.get(`${API_URL}/forums/${slug}`);
        return response.data;
    },

    // Create a new post
    createPost: async (forumId: number, data: { title: string; content: string; tags?: string }): Promise<Post> => {
        const response = await axios.post(`${API_URL}/forums/${forumId}/posts`, data);
        return response.data.post;
    },

    // Get a specific post
    getPost: async (forumSlug: string, postId: number): Promise<Post> => {
        // First get the forum to get its ID
        const forumResponse = await axios.get(`${API_URL}/forums/${forumSlug}`);
        const forum = forumResponse.data.forum;
        
        // Then get the post using the forum's ID
        const response = await axios.get(`${API_URL}/forums/${forum.id}/posts/${postId}`);
        return response.data.post;
    },

    // Create a new comment
    createComment: async (postId: number, data: { content: string; parent_id?: number }): Promise<Comment> => {
        const response = await axios.post(`${API_URL}/forums/posts/${postId}/comments`, data);
        return response.data.comment;
    },

    // Upvote a post
    upvotePost: async (postId: number): Promise<{ upvotes: number }> => {
        const response = await axios.post(`${API_URL}/forums/posts/${postId}/upvote`);
        return response.data;
    },

    // Upvote a comment
    upvoteComment: async (commentId: number): Promise<{ upvotes: number }> => {
        const response = await axios.post(`${API_URL}/forums/comments/${commentId}/upvote`);
        return response.data;
    },

    // Like a post
    likePost: async (postId: number): Promise<{ likes: number; is_liked: boolean }> => {
        const response = await axios.post(`${API_URL}/forums/posts/${postId}/like`);
        return response.data;
    },

    // Dislike a post
    dislikePost: async (postId: number): Promise<{ dislikes: number; is_disliked: boolean }> => {
        const response = await axios.post(`${API_URL}/forums/posts/${postId}/dislike`);
        return response.data;
    },

    // Like a comment
    likeComment: async (commentId: number): Promise<{ likes: number; is_liked: boolean }> => {
        const response = await axios.post(`${API_URL}/forums/comments/${commentId}/like`);
        return response.data;
    },

    // Dislike a comment
    dislikeComment: async (commentId: number): Promise<{ dislikes: number; is_disliked: boolean }> => {
        const response = await axios.post(`${API_URL}/forums/comments/${commentId}/dislike`);
        return response.data;
    },

    // Update a post
    updatePost: async (postId: number, data: { title: string; content: string; tags?: string }): Promise<Post> => {
        const response = await axios.put(`${API_URL}/forums/posts/${postId}`, data);
        return response.data.post;
    },

    // Delete a post
    deletePost: async (postId: number): Promise<void> => {
        await axios.delete(`${API_URL}/forums/posts/${postId}`);
    },

    // Get posts from followed users
    getFollowedUsersPosts: async (): Promise<Post[]> => {
        try {
            console.log('Fetching posts from followed users...');
            const response = await axios.get(`${API_URL}/following/posts`);
            console.log('Response:', response.data);
            if (!response.data.posts) {
                console.error('No posts array in response:', response.data);
                return [];
            }
            return response.data.posts;
        } catch (error: any) {
            console.error('Error fetching followed users posts:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
            }
            throw error;
        }
    },

    async joinForum(forumId: number): Promise<void> {
        await axios.post(`${API_URL}/forums/${forumId}/join`);
    },

    async leaveForum(forumId: number): Promise<void> {
        await axios.post(`${API_URL}/forums/${forumId}/leave`);
    },

    // Save a post
    savePost: async (postId: number): Promise<{ is_saved: boolean }> => {
        const response = await axios.post(`${API_URL}/forums/posts/${postId}/save`);
        return response.data;
    },

    // Unsave a post
    unsavePost: async (postId: number): Promise<{ is_saved: boolean }> => {
        const response = await axios.post(`${API_URL}/forums/posts/${postId}/unsave`);
        return response.data;
    },

    async getSavedPosts() {
        const response = await axios.get('/saved-posts');
        return response.data;
    }
}; 