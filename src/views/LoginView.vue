<script setup>
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const validationMessage = ref('');
const invalidField = ref('');

function validateCredentials() {
    if (!email.value.trim()) {
        validationMessage.value = 'Enter your email address.';
        invalidField.value = 'email';
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        validationMessage.value = 'Enter a valid email address.';
        invalidField.value = 'email';
        return false;
    }

    if (!password.value) {
        validationMessage.value = 'Enter your password.';
        invalidField.value = 'password';
        return false;
    }

    validationMessage.value = '';
    invalidField.value = '';
    return true;
}

function clearMessages() {
    validationMessage.value = '';
    invalidField.value = '';
    authStore.errorMessage = '';
}

function getLoginErrorMessage(error) {
    if (error.status === 401) {
        return 'The email or password you entered is incorrect.';
    }

    if (error.status === null) {
        return 'Unable to connect. Check your connection and try again.';
    }

    return error.message || 'Sign in failed. Please try again.';
}

async function submitLogin() {
    if (authStore.isLoading || !validateCredentials()) {
        return;
    }

    try {
        await authStore.login({
            email: email.value.trim(),
            password: password.value,
        });
        password.value = '';

        const redirect = route.query.redirect;
        const destination =
            typeof redirect === 'string' &&
            redirect.startsWith('/') &&
            !redirect.startsWith('//')
                ? redirect
                : { name: 'dashboard' };

        await router.replace(destination);
    } catch (error) {
        authStore.errorMessage = getLoginErrorMessage(error);
    }
}
</script>

<template>
    <main class="min-h-screen bg-slate-100 text-slate-900">
        <div class="mx-auto grid min-h-screen max-w-[90rem] lg:grid-cols-2">
            <section class="flex items-center justify-center bg-white px-5 py-10 sm:px-10 lg:px-16">
                <div class="w-full max-w-md">
                    <RouterLink
                        to="/login"
                        class="mb-12 inline-flex items-center gap-3"
                        aria-label="Inventory Management sign in"
                    >
                        <span
                            class="grid size-12 place-items-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-900/15"
                            aria-hidden="true"
                        >
                            <svg viewBox="0 0 24 24" fill="none" class="size-7">
                                <path
                                    d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    stroke-linejoin="round"
                                />
                                <path
                                    d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v8.4M8 5.3l8 4.5"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </span>
                        <span>
                            <span class="block text-base font-bold tracking-tight">Inventory Management</span>
                            <span class="block text-xs font-medium tracking-wide text-slate-500">OPERATIONS PORTAL</span>
                        </span>
                    </RouterLink>

                    <div class="mb-8">
                        <p class="mb-2 text-sm font-semibold text-blue-700">WELCOME BACK</p>
                        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Sign in to your account
                        </h1>
                        <p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                            Enter your account details to continue to your inventory workspace.
                        </p>
                    </div>

                    <form class="space-y-5" novalidate @submit.prevent="submitLogin">
                        <div>
                            <label for="email" class="mb-2 block text-sm font-medium text-slate-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                v-model="email"
                                name="email"
                                type="email"
                                inputmode="email"
                                autocomplete="username"
                                required
                                autofocus
                                placeholder="you@company.com"
                                class="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                :aria-invalid="invalidField === 'email'"
                                :aria-describedby="
                                    validationMessage || authStore.errorMessage
                                        ? 'login-feedback'
                                        : undefined
                                "
                                @input="clearMessages"
                            />
                        </div>

                        <div>
                            <label for="password" class="mb-2 block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div class="relative">
                                <input
                                    id="password"
                                    v-model="password"
                                    name="password"
                                    :type="showPassword ? 'text' : 'password'"
                                    autocomplete="current-password"
                                    required
                                    placeholder="Enter your password"
                                    class="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 pr-16 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                    :aria-invalid="invalidField === 'password'"
                                    :aria-describedby="
                                        validationMessage || authStore.errorMessage
                                            ? 'login-feedback'
                                            : undefined
                                    "
                                    @input="clearMessages"
                                />
                                <button
                                    type="button"
                                    class="absolute inset-y-0 right-0 inline-flex items-center px-3.5 text-sm font-medium text-slate-600 outline-none hover:text-blue-700 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-100"
                                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                    :aria-pressed="showPassword"
                                    aria-controls="password"
                                    @click="showPassword = !showPassword"
                                >
                                    {{ showPassword ? 'Hide' : 'Show' }}
                                </button>
                            </div>
                        </div>

                        <p
                            v-if="validationMessage || authStore.errorMessage"
                            id="login-feedback"
                            class="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
                            role="alert"
                            aria-live="assertive"
                        >
                            {{ validationMessage || authStore.errorMessage }}
                        </p>

                        <button
                            type="submit"
                            class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                            :disabled="authStore.isLoading"
                            :aria-busy="authStore.isLoading"
                        >
                            <svg
                                v-if="authStore.isLoading"
                                class="size-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    stroke="currentColor"
                                    stroke-width="3"
                                />
                                <path
                                    class="opacity-90"
                                    fill="currentColor"
                                    d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z"
                                />
                            </svg>
                            {{ authStore.isLoading ? 'Signing in…' : 'Sign in' }}
                        </button>
                    </form>

                    <p class="mt-8 text-center text-xs leading-5 text-slate-500">
                        Authorized users only. Your session is securely maintained for this browser session.
                    </p>
                </div>
            </section>

            <aside class="relative hidden overflow-hidden bg-slate-950 px-12 py-14 text-white lg:flex lg:items-center xl:px-20">
                <div class="absolute -right-32 -top-32 size-96 rounded-full bg-blue-600/20 blur-3xl" />
                <div class="absolute -bottom-40 -left-32 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

                <div class="relative mx-auto max-w-lg">
                    <div class="mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-100">
                        <span class="size-1.5 rounded-full bg-cyan-300" />
                        INVENTORY OPERATIONS PLATFORM
                    </div>

                    <h2 class="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                        Keep every part of your operation in view.
                    </h2>
                    <p class="mt-6 max-w-md text-base leading-7 text-slate-300">
                        Manage products, suppliers, and stock movements from one clear, dependable workspace.
                    </p>

                    <div class="mt-12 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
                        <div class="flex items-center gap-3">
                            <span class="grid size-10 place-items-center rounded-lg bg-blue-500/20 text-blue-200">
                                <svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
                                    <path
                                        d="M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6m4 6V4"
                                        stroke="currentColor"
                                        stroke-width="1.7"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </span>
                            <div>
                                <p class="text-sm font-semibold">One workspace for your inventory</p>
                                <p class="mt-1 text-xs text-slate-400">Clear workflows. Confident decisions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </main>
</template>
