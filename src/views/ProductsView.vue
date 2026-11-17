<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import {
    createProduct,
    listProducts,
    updateProduct,
    updateProductStatus,
} from '../services/product.service.js';
import { listCategories } from '../services/category.service.js';
import { listSuppliers } from '../services/supplier.service.js';
import ProductDetailsModal from '../components/products/ProductDetailsModal.vue';
import ProductFormModal from '../components/products/ProductFormModal.vue';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const OPTION_PAGE_SIZE = 100;
const authStore = useAuthStore();
const products = ref([]);
const categories = ref([]);
const suppliers = ref([]);
const page = ref(1);
const limit = ref(PAGE_SIZE_OPTIONS[0]);
const pagination = ref({ page: 1, limit: PAGE_SIZE_OPTIONS[0], total: 0, totalPages: 0 });
const isLoading = ref(true);
const isLoadingOptions = ref(false);
const isSubmitting = ref(false);
const statusUpdatingId = ref('');
const errorMessage = ref('');
const optionsError = ref('');
const mutationError = ref('');
const successMessage = ref('');
const showProductForm = ref(false);
const formMode = ref('create');
const selectedProduct = ref(null);
const selectedProductId = ref('');
const searchInput = ref('');
let searchTimer;
let listRequestId = 0;
let successTimer;

const filters = reactive({
    categoryId: '',
    supplierId: '',
    isActive: '',
});

const isAdmin = computed(() => authStore.user?.role === 'Admin');
const canReadLookupData = computed(() =>
    ['Admin', 'Manager'].includes(authStore.user?.role),
);
const pageCount = computed(() => Math.max(1, pagination.value.totalPages || 0));
const numberFormatter = new Intl.NumberFormat('en-PH');
const moneyFormatter = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatNumber(value) {
    return Number.isFinite(value) ? numberFormatter.format(value) : '—';
}

function formatCurrency(value) {
    return Number.isFinite(value) ? `₱${moneyFormatter.format(value)}` : '—';
}

function showSuccess(message) {
    successMessage.value = message;
    clearTimeout(successTimer);
    successTimer = setTimeout(() => {
        successMessage.value = '';
    }, 5000);
}

async function loadProducts() {
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
    if (filters.categoryId) {
        params.categoryId = filters.categoryId;
    }
    if (filters.supplierId) {
        params.supplierId = filters.supplierId;
    }
    if (filters.isActive) {
        params.isActive = filters.isActive;
    }

    try {
        const result = await listProducts(params);
        if (requestId === listRequestId) {
            products.value = result.products;
            pagination.value = result.pagination;
        }
    } catch (error) {
        if (requestId === listRequestId) {
            errorMessage.value =
                error.message || 'Unable to load products. Please try again.';
            products.value = [];
        }
    } finally {
        if (requestId === listRequestId) {
            isLoading.value = false;
        }
    }
}

async function loadAllOptions(listFunction, collectionName) {
    const firstPage = await listFunction({
        page: 1,
        limit: OPTION_PAGE_SIZE,
    });
    const totalPages = firstPage.pagination?.totalPages ?? 1;
    const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
            listFunction({
                page: index + 2,
                limit: OPTION_PAGE_SIZE,
            }),
        ),
    );

    return [
        ...(firstPage[collectionName] ?? []),
        ...remainingPages.flatMap((result) => result[collectionName] ?? []),
    ];
}

async function loadOptions() {
    if (!canReadLookupData.value) {
        return;
    }

    isLoadingOptions.value = true;
    optionsError.value = '';

    try {
        const [categoryOptions, supplierOptions] = await Promise.all([
            loadAllOptions(listCategories, 'categories'),
            loadAllOptions(listSuppliers, 'suppliers'),
        ]);
        categories.value = categoryOptions;
        suppliers.value = supplierOptions;
    } catch (error) {
        optionsError.value =
            error.message || 'Unable to load category and supplier filters.';
    } finally {
        isLoadingOptions.value = false;
    }
}

function openCreateForm() {
    formMode.value = 'create';
    selectedProduct.value = null;
    mutationError.value = '';
    showProductForm.value = true;
}

function openEditForm(product) {
    formMode.value = 'edit';
    selectedProduct.value = product;
    mutationError.value = '';
    showProductForm.value = true;
}

async function submitProduct(payload) {
    isSubmitting.value = true;
    mutationError.value = '';

    try {
        if (formMode.value === 'create') {
            await createProduct(payload);
            showSuccess('Product created successfully.');
        } else {
            await updateProduct(selectedProduct.value.id, payload);
            showSuccess('Product updated successfully.');
        }
        showProductForm.value = false;
        await loadProducts();
    } catch (error) {
        mutationError.value =
            error.message || 'Unable to save the product. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
}

async function toggleProductStatus(product) {
    statusUpdatingId.value = product.id;
    mutationError.value = '';

    try {
        await updateProductStatus(product.id, !product.isActive);
        showSuccess(
            `Product ${product.isActive ? 'deactivated' : 'activated'} successfully.`,
        );
        await loadProducts();
    } catch (error) {
        mutationError.value =
            error.message || 'Unable to update product status.';
    } finally {
        statusUpdatingId.value = '';
    }
}

function resetFilters() {
    searchInput.value = '';
    filters.categoryId = '';
    filters.supplierId = '';
    filters.isActive = '';
    page.value = 1;
}

watch(
    [() => filters.categoryId, () => filters.supplierId, () => filters.isActive, limit],
    () => {
        page.value = 1;
        loadProducts();
    },
);

watch(page, loadProducts);

watch(searchInput, () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        if (page.value !== 1) {
            page.value = 1;
        } else {
            loadProducts();
        }
    }, 300);
});

onMounted(() => {
    loadProducts();
    loadOptions();
});

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
                    Products
                </h2>
                <p class="mt-2 text-sm text-slate-600">
                    Search and review your product catalog and current stock.
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
                Add product
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
            v-if="mutationError && !showProductForm"
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

        <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Product filters">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <label class="relative sm:col-span-2 xl:col-span-2">
                    <span class="sr-only">Search by SKU or product name</span>
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
                        placeholder="Search SKU or product name"
                        class="min-h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </label>

                <label>
                    <span class="sr-only">Filter by category</span>
                    <select
                        v-model="filters.categoryId"
                        :disabled="!canReadLookupData || isLoadingOptions"
                        class="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        <option value="">All categories</option>
                        <option v-for="category in categories" :key="category.id" :value="category.id">
                            {{ category.name }}
                        </option>
                    </select>
                </label>

                <label>
                    <span class="sr-only">Filter by supplier</span>
                    <select
                        v-model="filters.supplierId"
                        :disabled="!canReadLookupData || isLoadingOptions"
                        class="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        <option value="">All suppliers</option>
                        <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                            {{ supplier.name }}
                        </option>
                    </select>
                </label>

                <label>
                    <span class="sr-only">Filter by status</span>
                    <select
                        v-model="filters.isActive"
                        class="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="">All statuses</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </label>
            </div>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p v-if="!canReadLookupData" class="text-xs text-slate-500">
                    Category and supplier filters require an Admin or Manager account.
                </p>
                <p v-else-if="optionsError" class="text-xs text-rose-700" role="alert">
                    {{ optionsError }}
                </p>
                <p v-else-if="isLoadingOptions" class="text-xs text-slate-500" role="status">
                    Loading category and supplier filters…
                </p>
                <span v-else></span>
                <button
                    type="button"
                    class="text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:underline"
                    @click="resetFilters"
                >
                    Clear filters
                </button>
            </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                <div>
                    <h3 class="font-semibold text-slate-900">Product catalog</h3>
                    <p class="mt-1 text-sm text-slate-500">
                        {{ formatNumber(pagination.total) }} products
                    </p>
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                    Rows
                    <select
                        v-model.number="limit"
                        class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
                            {{ size }}
                        </option>
                    </select>
                </label>
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
                    @click="loadProducts"
                >
                    Try again
                </button>
            </div>

            <div v-else-if="isLoading" class="space-y-3 p-5" role="status" aria-live="polite">
                <div v-for="row in 5" :key="row" class="h-12 animate-pulse rounded-lg bg-slate-100"></div>
                <span class="sr-only">Loading products</span>
            </div>

            <div v-else-if="products.length === 0" class="px-5 py-14 text-center">
                <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <svg viewBox="0 0 24 24" fill="none" class="size-6" aria-hidden="true">
                        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                        <path d="m4.5 7.75 7.5 4.5 7.5-4.5M12 12.5V21" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                    </svg>
                </div>
                <h4 class="mt-4 font-semibold text-slate-900">No products found</h4>
                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[1050px] border-collapse text-left text-sm">
                    <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th scope="col" class="px-4 py-3">SKU</th>
                            <th scope="col" class="px-4 py-3">Product name</th>
                            <th scope="col" class="px-4 py-3">Category</th>
                            <th scope="col" class="px-4 py-3">Supplier</th>
                            <th scope="col" class="px-4 py-3 text-right">Cost price</th>
                            <th scope="col" class="px-4 py-3 text-right">Selling price</th>
                            <th scope="col" class="px-4 py-3 text-right">Quantity</th>
                            <th scope="col" class="px-4 py-3 text-right">Reorder level</th>
                            <th scope="col" class="px-4 py-3">Status</th>
                            <th scope="col" class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="product in products" :key="product.id" class="transition hover:bg-slate-50/70">
                            <td class="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                                {{ product.sku }}
                            </td>
                            <td class="max-w-52 px-4 py-3">
                                <span class="block truncate font-medium text-slate-900" :title="product.name">
                                    {{ product.name }}
                                </span>
                            </td>
                            <td class="max-w-40 truncate px-4 py-3 text-slate-600" :title="product.categoryName">
                                {{ product.categoryName || '—' }}
                            </td>
                            <td class="max-w-40 truncate px-4 py-3 text-slate-600" :title="product.supplierName">
                                {{ product.supplierName || '—' }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                                {{ formatCurrency(product.costPrice) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                                {{ formatCurrency(product.sellingPrice) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                                {{ formatNumber(product.quantity) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                                {{ formatNumber(product.reorderLevel) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3">
                                <span
                                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                                    :class="product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                                >
                                    {{ product.isActive ? 'Active' : 'Inactive' }}
                                </span>
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right">
                                <div class="inline-flex items-center gap-1">
                                    <button
                                        type="button"
                                        class="rounded-md px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                        :aria-label="`View ${product.name} details`"
                                        @click="selectedProductId = product.id"
                                    >
                                        Details
                                    </button>
                                    <template v-if="isAdmin">
                                        <button
                                            type="button"
                                            class="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                            :aria-label="`Edit ${product.name}`"
                                            @click="openEditForm(product)"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-md px-2 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-wait disabled:opacity-50"
                                            :class="product.isActive ? 'text-rose-700 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'"
                                            :disabled="statusUpdatingId === product.id"
                                            :aria-label="`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`"
                                            @click="toggleProductStatus(product)"
                                        >
                                            {{
                                                statusUpdatingId === product.id
                                                    ? 'Saving…'
                                                    : product.isActive
                                                      ? 'Deactivate'
                                                      : 'Activate'
                                            }}
                                        </button>
                                    </template>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <footer
                v-if="!isLoading && !errorMessage && products.length"
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

        <ProductFormModal
            v-if="showProductForm"
            :key="`${formMode}-${selectedProduct?.id || 'new'}`"
            :product="selectedProduct"
            :categories="categories"
            :suppliers="suppliers"
            :is-submitting="isSubmitting"
            :submit-error="mutationError"
            @close="showProductForm = false"
            @submit="submitProduct"
        />
        <ProductDetailsModal
            v-if="selectedProductId"
            :product-id="selectedProductId"
            @close="selectedProductId = ''"
        />
    </div>
</template>
