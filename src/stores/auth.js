import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import * as authService from '../services/auth.service.js';
import {
    clearAccessToken,
    hasAccessToken,
} from '../services/auth-session.js';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const isLoading = ref(false);
    const isInitialized = ref(false);
    const errorMessage = ref('');
    const isAuthenticated = computed(() => user.value !== null);

    function clearSession() {
        clearAccessToken();
        user.value = null;
        errorMessage.value = '';
        isInitialized.value = true;
    }

    async function login(credentials) {
        isLoading.value = true;
        errorMessage.value = '';

        try {
            user.value = await authService.login(credentials);
            isInitialized.value = true;
            return user.value;
        } catch (error) {
            errorMessage.value = error.message;
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    async function getCurrentUser() {
        user.value = await authService.getCurrentUser();
        return user.value;
    }

    async function restoreSession() {
        if (isInitialized.value || isLoading.value) {
            return user.value;
        }

        if (!hasAccessToken()) {
            isInitialized.value = true;
            return null;
        }

        isLoading.value = true;
        errorMessage.value = '';

        try {
            return await getCurrentUser();
        } catch (error) {
            if (error.status === 401) {
                clearSession();
                return null;
            }

            errorMessage.value = error.message;
            return null;
        } finally {
            isInitialized.value = true;
            isLoading.value = false;
        }
    }

    async function logout() {
        isLoading.value = true;
        errorMessage.value = '';

        try {
            if (hasAccessToken()) {
                await authService.logout();
            }
        } catch (error) {
            errorMessage.value = error.message;
            throw error;
        } finally {
            clearSession();
            isLoading.value = false;
        }
    }

    return {
        user,
        isLoading,
        isInitialized,
        errorMessage,
        isAuthenticated,
        login,
        getCurrentUser,
        restoreSession,
        logout,
        clearSession,
    };
});
