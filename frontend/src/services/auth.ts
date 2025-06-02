import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
}

export const login = async (credentials: LoginCredentials) => {
    try {
        const response = await axiosInstance.post('/login', credentials);
        
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        
        return response.data;
    } catch (error: any) {
        console.error('Login error:', error.response?.data || error);
        
        if (error.response?.data?.errors) {
            // Handle validation errors
            const errors = error.response.data.errors;
            const errorMessages = Object.values(errors).flat();
            throw new Error(errorMessages.join(', '));
        } else if (error.response?.data?.message) {
            // Handle server error messages
            throw new Error(error.response.data.message);
        } else if (error.response?.status === 422) {
            // Handle Laravel validation errors
            const errors = error.response.data.errors;
            const errorMessages = Object.values(errors).flat();
            throw new Error(errorMessages.join(', '));
        } else if (error.response?.status === 401) {
            throw new Error('Invalid email or password');
        } else {
            // Handle network or other errors
            throw new Error('Login failed. Please check your connection and try again.');
        }
    }
};

export const register = async (data: RegisterData) => {
    try {
        const response = await axiosInstance.post('/register', data);
        return response.data;
    } catch (error: any) {
        console.error('Registration error:', error.response?.data || error);
        
        if (error.response?.data?.errors) {
            const errors = error.response.data.errors;
            const errorMessages = Object.values(errors).flat();
            throw new Error(errorMessages.join(', '));
        } else if (error.response?.status === 422) {
            const errors = error.response.data.errors;
            const errorMessages = Object.values(errors).flat();
            throw new Error(errorMessages.join(', '));
        } else if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error('Registration failed. Please try again.');
        }
    }
};

export const logout = async () => {
    try {
        await axiosInstance.post('/logout');
        localStorage.removeItem('auth_token');
        delete axiosInstance.defaults.headers.common['Authorization'];
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

export default axiosInstance; 