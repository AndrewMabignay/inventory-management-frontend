import axios from 'axios';
import { normalizeApiError } from './api-error.js';
import {
    getAccessToken,
    notifySessionExpired,
} from './auth-session.js';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

if (!baseURL) {
    throw new Error('VITE_API_BASE_URL is not configured.');
}

const api = axios.create({
    baseURL,
    timeout: 10_000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    const isLoginRequest = config.url?.replace(/\/+$/, '').endsWith('/auth/login');

    if (token && !isLoginRequest) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            notifySessionExpired();
        }

        return Promise.reject(normalizeApiError(error));
    },
);

export default api;
