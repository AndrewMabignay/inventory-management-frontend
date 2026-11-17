<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();
const router = useRouter();

async function signOut() {
    try {
        await authStore.logout();
    } catch (error) {
        authStore.errorMessage = error.message;
    } finally {
        await router.replace({ name: 'login' });
    }
}
</script>

<template>
    <main class="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-8">
        <div class="mx-auto max-w-5xl">
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <span class="grid size-11 place-items-center rounded-xl bg-blue-700 text-white">
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
                    <div>
                        <p class="font-semibold">Inventory Management</p>
                        <p class="text-xs text-slate-500">Operations workspace</p>
                    </div>
                </div>

                <button
                    type="button"
                    class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-60"
                    :disabled="authStore.isLoading"
                    @click="signOut"
                >
                    {{ authStore.isLoading ? 'Signing out…' : 'Sign out' }}
                </button>
            </header>

            <section class="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                <p class="text-sm font-semibold text-blue-700">DASHBOARD</p>
                <h1 class="mt-2 text-3xl font-semibold tracking-tight">
                    Welcome, {{ authStore.user?.firstName }}.
                </h1>
                <p class="mt-3 max-w-2xl leading-7 text-slate-600">
                    You are signed in to the Inventory Management workspace. Dashboard data and tools can be added here.
                </p>
            </section>
        </div>
    </main>
</template>
