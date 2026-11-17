<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);
const profileOpen = ref(false);
const profileMenu = ref(null);

const navigation = computed(() =>
    router
        .getRoutes()
        .filter((record) => record.meta.navigation)
        .filter(
            (record) =>
                !record.meta.roles ||
                record.meta.roles.includes(authStore.user?.role),
        )
        .sort(
            (left, right) =>
                (left.meta.navigationOrder ?? 999) -
                (right.meta.navigationOrder ?? 999),
        )
        .map((record) => ({
            name: record.name,
            label: record.meta.title,
            icon: record.meta.icon,
        })),
);

const pageTitle = computed(() => route.meta.title || 'Dashboard');
const userFullName = computed(() => {
    const name = [
        authStore.user?.firstName,
        authStore.user?.lastName,
    ]
        .filter(Boolean)
        .join(' ');

    return name || 'User';
});
const userInitials = computed(() =>
    userFullName.value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join(''),
);

function closeMenus() {
    sidebarOpen.value = false;
    profileOpen.value = false;
}

function handleOutsideClick(event) {
    if (profileOpen.value && !profileMenu.value?.contains(event.target)) {
        profileOpen.value = false;
    }
}

async function logout() {
    if (authStore.isLoading) {
        return;
    }

    profileOpen.value = false;

    try {
        await authStore.logout();
    } catch (error) {
        authStore.errorMessage = `Sign-out could not be confirmed: ${error.message}`;
    } finally {
        await router.replace({ name: 'login' });
    }
}

watch(
    () => route.fullPath,
    () => closeMenus(),
);

onMounted(() => document.addEventListener('pointerdown', handleOutsideClick));
onBeforeUnmount(() =>
    document.removeEventListener('pointerdown', handleOutsideClick),
);
</script>

<template>
    <div
        class="min-h-screen bg-slate-100 text-slate-900"
        @keydown.esc="closeMenus"
    >
        <button
            v-if="sidebarOpen"
            type="button"
            class="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
            aria-label="Close navigation menu"
            @click="sidebarOpen = false"
        />

        <aside
            id="dashboard-sidebar"
            class="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0"
            :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
            aria-label="Main sidebar"
        >
            <div class="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
                <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-700 text-white">
                    <svg viewBox="0 0 24 24" fill="none" class="size-6" aria-hidden="true">
                        <path
                            d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
                            stroke="currentColor"
                            stroke-width="1.7"
                            stroke-linejoin="round"
                        />
                        <path
                            d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v8.4"
                            stroke="currentColor"
                            stroke-width="1.7"
                            stroke-linejoin="round"
                        />
                    </svg>
                </span>
                <div class="min-w-0">
                    <p class="truncate text-sm font-bold tracking-tight">Inventory Management</p>
                    <p class="mt-0.5 text-[0.65rem] font-semibold tracking-[0.16em] text-slate-500">
                        OPERATIONS
                    </p>
                </div>
                <button
                    type="button"
                    class="ml-auto grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
                    aria-label="Close navigation menu"
                    @click="sidebarOpen = false"
                >
                    <svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
                        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
            </div>

            <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-6" aria-label="Dashboard navigation">
                <p class="mb-3 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Workspace
                </p>
                <RouterLink
                    v-for="item in navigation"
                    :key="item.name"
                    :to="{ name: item.name }"
                    class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    :class="
                        route.matched.some(
                            (record) => record.name === item.name
                        )
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    "
                    @click="sidebarOpen = false"
                >
                    <svg viewBox="0 0 24 24" fill="none" class="size-5 shrink-0" aria-hidden="true">
                        <template v-if="item.icon === 'dashboard'">
                            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7" />
                        </template>
                        <template v-else-if="item.icon === 'products'">
                            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                            <path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v8.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                        </template>
                        <template v-else-if="item.icon === 'categories'">
                            <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                            <rect x="13.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                            <rect x="3.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                            <rect x="13.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                        </template>
                        <template v-else-if="item.icon === 'suppliers'">
                            <path d="M4 20V8l8-5 8 5v12M2.5 20h19M9 20v-6h6v6M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                        </template>
                        <template v-else-if="item.icon === 'inventory'">
                            <path d="M4 7h15l-2-2m3 12H5l2 2M19 7a7 7 0 0 1 1 9M5 17a7 7 0 0 1-1-9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                        </template>
                        <template v-else-if="item.icon === 'users'">
                            <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 4.2a3.5 3.5 0 0 1 0 6.8M17 15h.5a3.5 3.5 0 0 1 3.5 3.5V20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                        </template>
                        <template v-else-if="item.icon === 'reports'">
                            <path d="M4 20V5m0 15h16M8 15v-4m4 4V7m4 8v-6m4 6V4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                        </template>
                    </svg>
                    <span>{{ item.label }}</span>
                </RouterLink>
            </nav>

            <div class="border-t border-slate-200 p-4">
                <p class="truncate text-xs font-medium text-slate-700">{{ userFullName }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ authStore.user?.role }}</p>
            </div>
        </aside>

        <div class="min-h-screen lg:pl-72">
            <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                <div class="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        class="grid size-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 lg:hidden"
                        aria-label="Open navigation menu"
                        aria-controls="dashboard-sidebar"
                        :aria-expanded="sidebarOpen"
                        @click="sidebarOpen = true"
                    >
                        <svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
                            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                        </svg>
                    </button>
                    <h1 class="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                        {{ pageTitle }}
                    </h1>
                </div>

                <div ref="profileMenu" class="relative ml-3">
                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-xl p-1.5 text-left outline-none transition hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-100 sm:gap-3 sm:pl-3"
                        aria-haspopup="menu"
                        aria-controls="profile-menu"
                        :aria-expanded="profileOpen"
                        @click="profileOpen = !profileOpen"
                        @keydown.esc="profileOpen = false"
                    >
                        <span class="hidden min-w-0 sm:block">
                            <span class="block max-w-44 truncate text-sm font-semibold text-slate-800">
                                {{ userFullName }}
                            </span>
                            <span class="mt-0.5 block text-xs text-slate-500">
                                {{ authStore.user?.role }}
                            </span>
                        </span>
                        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                            {{ userInitials }}
                        </span>
                        <svg viewBox="0 0 20 20" fill="none" class="hidden size-4 text-slate-500 sm:block" aria-hidden="true">
                            <path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>

                    <div
                        v-if="profileOpen"
                        id="profile-menu"
                        class="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
                        role="menu"
                    >
                        <div class="border-b border-slate-100 px-4 py-3">
                            <p class="truncate text-sm font-semibold text-slate-900">{{ userFullName }}</p>
                            <p class="mt-1 truncate text-xs text-slate-500">{{ authStore.user?.email }}</p>
                            <p class="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {{ authStore.user?.role }}
                            </p>
                        </div>
                        <button
                            type="button"
                            class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:outline-none focus-visible:text-red-700"
                            role="menuitem"
                            :disabled="authStore.isLoading"
                            @click="logout"
                        >
                            <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
                                <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8m3-3 4-4-4-4m4 4H7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            {{ authStore.isLoading ? 'Signing out…' : 'Logout' }}
                        </button>
                    </div>
                </div>
            </header>

            <main class="p-4 sm:p-6 lg:p-8">
                <RouterView />
            </main>
        </div>
    </div>
</template>
