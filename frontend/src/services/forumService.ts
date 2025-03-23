import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

export interface Forum {
    id: number;
    name: string;
    slug: string;
    description: string;
    image_url: string | null;
    member_count: number;
    post_count: number;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: number;
    forum_id: number;
    user_id: number;
    title: string;
    content: string;
    upvotes: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        avatar_url: string | null;
    };
    tags: {
        id: number;
        tag: string;
    }[];
    comments?: Comment[];
}

export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    parent_id: number | null;
    content: string;
    upvotes: number;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
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
    getPost: async (forumId: number, postId: number): Promise<Post> => {
        const response = await axios.get(`${API_URL}/forums/${forumId}/posts/${postId}`);
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
}; 