import api from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://127.0.0.1:8000/api';

// Create axios instance with base configuration
const axiosInstance = api.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove('auth_token');
            delete axiosInstance.defaults.headers.common['Authorization'];
        }
        return Promise.reject(error);
    }
);

// Initialize auth token from cookie if it exists
const token = Cookies.get('auth_token');
if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const login = async (email: string, password: string) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/login`, { email, password });

        if (response.data.token) {
            const token = response.data.token;
            Cookies.set('auth_token', token, {
                expires: 30,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax'
            });
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

export const register = async (data: any) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/register`, data);

        if (response.data.token) {
            const token = response.data.token;
            Cookies.set('auth_token', token, {
                expires: 30,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax'
            });
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

export const logout = async () => {
    try {
        await axiosInstance.post(`${API_URL}/logout`);
        Cookies.remove('auth_token');
        delete axiosInstance.defaults.headers.common['Authorization'];
        return true;
    } catch (error) {
        throw new Error('Logout failed');
    }
};

export default axiosInstance; 