<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
    createCategory,
    deleteCategory,
    getCategoryById,
    listCategories,
    updateCategory,
} from '../services/category.service.js';
import CategoryDeleteModal from '../components/categories/CategoryDeleteModal.vue';
import CategoryFormModal from '../components/categories/CategoryFormModal.vue';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const authStore = useAuthStore();
const categories = ref([]);
const page = ref(1);
const limit = ref(PAGE_SIZE_OPTIONS[0]);
const pagination = ref({
    page: 1,
    limit: PAGE_SIZE_OPTIONS[0],
    total: 0,
    totalPages: 0,
});
const searchInput = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);
const loadingCategoryId = ref('');
const deletingCategoryId = ref('');
const errorMessage = ref('');
const mutationError = ref('');
const deleteError = ref('');
const successMessage = ref('');
const selectedCategory = ref(null);
const categoryToDelete = ref(null);
const showCategoryForm = ref(false);
let searchTimer;
let listRequestId = 0;
let successTimer;

const isAdmin = computed(() => authStore.user?.role === 'Admin');
const pageCount = computed(() => Math.max(1, pagination.value.totalPages || 0));
const numberFormatter = new Intl.NumberFormat('en-PH');
const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function formatNumber(value) {
    return Number.isFinite(value) ? numberFormatter.format(value) : '—';
}

function formatDate(value) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function showSuccess(message) {
    successMessage.value = message;
    clearTimeout(successTimer);
    successTimer = setTimeout(() => {
        successMessage.value = '';
    }, 5000);
}

async function loadCategories() {
    const requestId = ++listRequestId;
    isLoading.value = true;
    errorMessage.value = '';
    const params = {
        page: page.value,
        limit: limit.value,
    };

    if (searchInput.value.trim()) {
        params.search = searchInput.value.trim();
    }

    try {
        const result = await listCategories(params);
        if (requestId === listRequestId) {
            categories.value = result.categories;
            pagination.value = result.pagination;
        }
    } catch (error) {
        if (requestId === listRequestId) {
            errorMessage.value =
                error.message || 'Unable to load categories. Please try again.';
            categories.value = [];
        }
    } finally {
        if (requestId === listRequestId) {
            isLoading.value = false;
        }
    }
}

function openCreateForm() {
    selectedCategory.value = null;
    mutationError.value = '';
    showCategoryForm.value = true;
}

async function openEditForm(category) {
    loadingCategoryId.value = category.id;
    mutationError.value = '';

    try {
        selectedCategory.value = await getCategoryById(category.id);
        showCategoryForm.value = true;
    } catch (error) {
        mutationError.value =
            error.message || 'Unable to load the category for editing.';
    } finally {
        loadingCategoryId.value = '';
    }
}

async function submitCategory(payload) {
    isSubmitting.value = true;
    mutationError.value = '';

    try {
        if (selectedCategory.value) {
            await updateCategory(selectedCategory.value.id, payload);
            showSuccess('Category updated successfully.');
        } else {
            await createCategory(payload);
            showSuccess('Category created successfully.');
        }
        showCategoryForm.value = false;
        await loadCategories();
    } catch (error) {
        mutationError.value =
            error.message || 'Unable to save the category. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
}

function requestDelete(category) {
    categoryToDelete.value = category;
    deleteError.value = '';
}

async function confirmDelete() {
    const category = categoryToDelete.value;
    if (!category || deletingCategoryId.value) {
        return;
    }

    deletingCategoryId.value = category.id;
    deleteError.value = '';

    try {
        await deleteCategory(category.id);
        categoryToDelete.value = null;
        showSuccess('Category deleted successfully.');
        if (categories.value.length === 1 && page.value > 1) {
            page.value -= 1;
        } else {
            await loadCategories();
        }
    } catch (error) {
        deleteError.value =
            error.status === 409
                ? 'This category cannot be deleted because one or more products currently use it. Reassign or remove those products before trying again.'
                : error.message || 'Unable to delete the category. Please try again.';
    } finally {
        deletingCategoryId.value = '';
    }
}

function clearSearch() {
    searchInput.value = '';
    page.value = 1;
}

watch(limit, () => {
    if (page.value !== 1) {
        page.value = 1;
    } else {
        loadCategories();
    }
});

watch(page, loadCategories);

watch(searchInput, () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        if (page.value !== 1) {
            page.value = 1;
        } else {
            loadCategories();
        }
    }, 300);
});

onMounted(loadCategories);

onBeforeUnmount(() => {
    clearTimeout(searchTimer);
    clearTimeout(successTimer);
});
</script>

<template>
    <div class="space-y-6">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-sm font-semibold text-blue-700">CATALOG</p>
                <h2 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Categories
                </h2>
                <p class="mt-2 text-sm text-slate-600">
                    Organize products into clear, searchable categories.
                </p>
            </div>
            <button
                v-if="isAdmin"
                type="button"
                class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                @click="openCreateForm"
            >
                <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
                Add category
            </button>
        </header>

        <div
            v-if="successMessage"
            class="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
        >
            <span>{{ successMessage }}</span>
            <button
                type="button"
                class="font-semibold hover:text-emerald-950 focus-visible:outline-none focus-visible:underline"
                aria-label="Dismiss success message"
                @click="successMessage = ''"
            >
                Dismiss
            </button>
        </div>

        <div
            v-if="mutationError && !showCategoryForm"
            class="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            role="alert"
        >
            <span>{{ mutationError }}</span>
            <button
                type="button"
                class="font-semibold hover:text-rose-950 focus-visible:outline-none focus-visible:underline"
                aria-label="Dismiss error message"
                @click="mutationError = ''"
            >
                Dismiss
            </button>
        </div>

        <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Category search">
            <div class="flex flex-col gap-3 sm:flex-row">
                <label class="relative flex-1">
                    <span class="sr-only">Search categories by name</span>
                    <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    >
                        <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" stroke-width="1.5" />
                        <path d="m13 13 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    </svg>
                    <input
                        v-model="searchInput"
                        type="search"
                        maxlength="100"
                        placeholder="Search category name"
                        class="min-h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                    Rows
                    <select
                        v-model.number="limit"
                        class="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
                            {{ size }}
                        </option>
                    </select>
                </label>
            </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                <div>
                    <h3 class="font-semibold text-slate-900">Category list</h3>
                    <p class="mt-1 text-sm text-slate-500">
                        {{ formatNumber(pagination.total) }} categories
                    </p>
                </div>
            </div>

            <div
                v-if="errorMessage"
                class="m-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                role="alert"
            >
                <span>{{ errorMessage }}</span>
                <button
                    type="button"
                    class="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                    @click="loadCategories"
                >
                    Try again
                </button>
            </div>

            <div v-else-if="isLoading" class="space-y-3 p-5" role="status" aria-live="polite">
                <div v-for="row in 5" :key="row" class="h-12 animate-pulse rounded-lg bg-slate-100"></div>
                <span class="sr-only">Loading categories</span>
            </div>

            <div v-else-if="categories.length === 0" class="px-5 py-14 text-center">
                <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <svg viewBox="0 0 24 24" fill="none" class="size-6" aria-hidden="true">
                        <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" />
                        <rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" />
                        <rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" />
                        <rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                </div>
                <h4 class="mt-4 font-semibold text-slate-900">No categories found</h4>
                <p class="mt-1 text-sm text-slate-500">
                    {{ searchInput.trim() ? 'Try another category name.' : 'Categories will appear here once they are added.' }}
                </p>
                <button
                    v-if="searchInput"
                    type="button"
                    class="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:underline"
                    @click="clearSearch"
                >
                    Clear search
                </button>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th scope="col" class="px-4 py-3">Category name</th>
                            <th scope="col" class="px-4 py-3">Description</th>
                            <th scope="col" class="px-4 py-3">Date created</th>
                            <th scope="col" class="px-4 py-3">Date updated</th>
                            <th scope="col" class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr
                            v-for="category in categories"
                            :key="category.id"
                            class="transition hover:bg-slate-50/70"
                        >
                            <td class="max-w-56 px-4 py-3 font-medium text-slate-900">
                                <span class="block truncate" :title="category.name">
                                    {{ category.name }}
                                </span>
                            </td>
                            <td class="max-w-80 px-4 py-3 text-slate-600">
                                <span
                                    class="block whitespace-pre-wrap break-words"
                                    :title="category.description || ''"
                                >
                                    {{ category.description || '—' }}
                                </span>
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-slate-600">
                                {{ formatDate(category.createdAt) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-slate-600">
                                {{ formatDate(category.updatedAt) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right">
                                <template v-if="isAdmin">
                                    <button
                                        type="button"
                                        class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-wait disabled:opacity-50"
                                        :disabled="loadingCategoryId === category.id"
                                        :aria-label="`Edit ${category.name}`"
                                        @click="openEditForm(category)"
                                    >
                                        {{ loadingCategoryId === category.id ? 'Loading…' : 'Edit' }}
                                    </button>
                                    <button
                                        type="button"
                                        class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                                        :aria-label="`Delete ${category.name}`"
                                        @click="requestDelete(category)"
                                    >
                                        Delete
                                    </button>
                                </template>
                                <span v-else class="text-xs text-slate-400">View only</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <footer
                v-if="!isLoading && !errorMessage && categories.length"
                class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5"
            >
                <p class="text-sm text-slate-500">
                    Page {{ pagination.page }} of {{ pageCount }}
                    <span class="mx-1 text-slate-300">·</span>
                    {{ formatNumber(pagination.total) }} total
                </p>
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        class="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="page <= 1"
                        @click="page -= 1"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        class="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="page >= pageCount"
                        @click="page += 1"
                    >
                        Next
                    </button>
                </div>
            </footer>
        </section>

        <CategoryFormModal
            v-if="showCategoryForm"
            :key="selectedCategory?.id || 'new-category'"
            :category="selectedCategory"
            :is-submitting="isSubmitting"
            :submit-error="mutationError"
            @close="showCategoryForm = false"
            @submit="submitCategory"
        />
        <CategoryDeleteModal
            v-if="categoryToDelete"
            :category="categoryToDelete"
            :is-deleting="deletingCategoryId === categoryToDelete.id"
            :error-message="deleteError"
            @close="categoryToDelete = null"
            @confirm="confirmDelete"
        />
    </div>
</template>
