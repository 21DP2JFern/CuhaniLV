import axiosInstance from './auth';

export interface NewsArticle {
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

export const newsService = {
    getLatestNews: async (limit: number = 3): Promise<NewsArticle[]> => {
        try {
            const response = await axiosInstance.get(`/news?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching latest news:', error);
            return [];
        }
    }
}; 