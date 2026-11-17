import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: { name: 'login' },
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: () => import('../views/DashboardView.vue'),
            meta: { requiresAuth: true },
        },
    ],
});

router.beforeEach(async (to) => {
    const authStore = useAuthStore();

    if (!authStore.isInitialized) {
        await authStore.restoreSession();
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return {
            name: 'login',
            query: { redirect: to.fullPath },
        };
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
        return { name: 'dashboard' };
    }
});

export default router;
