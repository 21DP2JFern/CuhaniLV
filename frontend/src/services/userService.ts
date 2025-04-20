import axios from './auth';

export interface User {
    id: number;
    username: string;
    profile_picture?: string;
    bio?: string;
    banner?: string;
    is_following?: boolean;
}

export const userService = {
    searchUsers: async (query: string): Promise<User[]> => {
        try {
            const response = await axios.get('/search/users', {
                params: { query }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    },

    getUserProfile: async (username: string): Promise<User> => {
        try {
            const response = await axios.get(`/users/${username}`);
            return response.data.user;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }
}; 