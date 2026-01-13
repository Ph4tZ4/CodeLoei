import { create } from 'zustand';
import api from '../api/axios';

interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    picture?: string;
    user_type: 'general' | 'college_member';
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: any) => Promise<void>;
    register: (credentials: any) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/login', credentials);
            localStorage.setItem('token', res.data.access_token);
            set({
                user: res.data.user,
                token: res.data.access_token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (err: any) {
            set({
                error: err.response?.data?.msg || 'Login failed',
                isLoading: false
            });
            throw err;
        }
    },

    register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/register', credentials);
            localStorage.setItem('token', res.data.access_token);
            set({
                user: res.data.user,
                token: res.data.access_token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (err: any) {
            set({
                error: err.response?.data?.msg || 'Registration failed',
                isLoading: false
            });
            throw err;
        }
    },

    googleLogin: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/google', { id_token: idToken });
            localStorage.setItem('token', res.data.access_token);
            set({
                user: res.data.user,
                token: res.data.access_token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (err: any) {
            set({
                error: err.response?.data?.msg || 'Google Login failed',
                isLoading: false
            });
            throw err;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadUser: async () => {
        // Optionally verify token or get user profile current
        // Current implementation assumes token persistence is enough for auth state check
        // but fetching profile ensures validity
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await api.get('/users/profile'); // Or /users/test-auth
            set({ user: res.data.user });
        } catch (err) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    }
}));
