import { ApiError } from './api-error.js';
import api from './api.js';
import { clearAccessToken, saveAccessToken } from './auth-session.js';

export async function login(credentials) {
    clearAccessToken();
    const { data } = await api.post('/auth/login', credentials);

    if (
        typeof data?.accessToken !== 'string' ||
        !data.accessToken ||
        data.tokenType !== 'Bearer' ||
        !data.user ||
        typeof data.user.id !== 'string'
    ) {
        throw new ApiError('The login response was invalid.');
    }

    saveAccessToken(data.accessToken);
    return data.user;
}

export async function getCurrentUser() {
    const { data } = await api.get('/auth/me');

    if (!data?.user || typeof data.user.id !== 'string') {
        throw new ApiError('The current-user response was invalid.');
    }

    return data.user;
}

export async function logout() {
    await api.post('/auth/logout');
}
