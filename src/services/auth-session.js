export const AUTH_SESSION_EXPIRED_EVENT =
    'inventory-management:auth-session-expired';

const ACCESS_TOKEN_KEY = 'inventory-management.access-token';

export function getAccessToken() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function hasAccessToken() {
    return Boolean(getAccessToken());
}

export function saveAccessToken(token) {
    if (typeof window === 'undefined') {
        throw new Error('Session storage is unavailable.');
    }

    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
}

export function notifySessionExpired() {
    clearAccessToken();

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }
}
