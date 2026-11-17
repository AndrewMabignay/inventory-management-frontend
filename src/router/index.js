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
            component: () => import('../layouts/DashboardLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('../views/DashboardView.vue'),
                    meta: {
                        title: 'Dashboard',
                        navigation: true,
                        navigationOrder: 1,
                        icon: 'dashboard',
                    },
                },
                {
                    path: 'products',
                    name: 'products',
                    component: () => import('../views/WorkspacePlaceholderView.vue'),
                    meta: {
                        title: 'Products',
                        navigation: true,
                        navigationOrder: 2,
                        icon: 'products',
                    },
                },
                {
                    path: 'categories',
                    name: 'categories',
                    component: () => import('../views/WorkspacePlaceholderView.vue'),
                    meta: {
                        title: 'Categories',
                        navigation: true,
                        navigationOrder: 3,
                        icon: 'categories',
                    },
                },
                {
                    path: 'suppliers',
                    name: 'suppliers',
                    component: () => import('../views/WorkspacePlaceholderView.vue'),
                    meta: {
                        title: 'Suppliers',
                        navigation: true,
                        navigationOrder: 4,
                        icon: 'suppliers',
                    },
                },
                {
                    path: 'inventory',
                    name: 'inventory',
                    component: () => import('../views/WorkspacePlaceholderView.vue'),
                    meta: {
                        title: 'Inventory',
                        navigation: true,
                        navigationOrder: 5,
                        icon: 'inventory',
                    },
                },
                {
                    path: 'users',
                    name: 'users',
                    component: () => import('../views/WorkspacePlaceholderView.vue'),
                    meta: {
                        title: 'Users',
                        navigation: true,
                        navigationOrder: 6,
                        icon: 'users',
                        roles: ['Admin'],
                    },
                },
                {
                    path: 'reports',
                    name: 'reports',
                    component: () => import('../views/WorkspacePlaceholderView.vue'),
                    meta: {
                        title: 'Reports',
                        navigation: true,
                        navigationOrder: 7,
                        icon: 'reports',
                        roles: ['Admin', 'Manager'],
                    },
                },
            ],
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

    if (
        to.meta.roles &&
        !to.meta.roles.includes(authStore.user?.role)
    ) {
        return { name: 'dashboard' };
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
        return { name: 'dashboard' };
    }
});

export default router;
