<script setup>
import { ref, watch } from 'vue';
import { getProductById } from '../../services/product.service.js';

const props = defineProps({
    productId: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(['close']);
const product = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');
const moneyFormatter = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat('en-PH');

function formatCurrency(value) {
    return Number.isFinite(value) ? `₱${moneyFormatter.format(value)}` : '—';
}

function formatNumber(value) {
    return Number.isFinite(value) ? numberFormatter.format(value) : '—';
}

function formatDate(value) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? '—'
        : new Intl.DateTimeFormat('en-PH', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(date);
}

watch(
    () => props.productId,
    async (productId) => {
        isLoading.value = true;
        errorMessage.value = '';
        product.value = null;

        try {
            product.value = await getProductById(productId);
        } catch (error) {
            errorMessage.value =
                error.message || 'Unable to load product details.';
        } finally {
            isLoading.value = false;
        }
    },
    { immediate: true },
);
</script>

<template>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
        @click.self="emit('close')"
    >
        <section
            class="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-details-title"
        >
            <header class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Product details
                    </p>
                    <h2 id="product-details-title" class="mt-1 text-xl font-semibold text-slate-900">
                        {{ product?.name || 'Product information' }}
                    </h2>
                </div>
                <button
                    type="button"
                    class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    aria-label="Close product details"
                    @click="emit('close')"
                >
                    <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true">
                        <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                    </svg>
                </button>
            </header>

            <div class="p-5 sm:p-7">
                <div v-if="isLoading" class="space-y-3" role="status" aria-live="polite">
                    <div class="h-4 w-2/3 animate-pulse rounded bg-slate-200"></div>
                    <div class="h-4 w-full animate-pulse rounded bg-slate-100"></div>
                    <div class="h-4 w-5/6 animate-pulse rounded bg-slate-100"></div>
                    <span class="sr-only">Loading product details</span>
                </div>
                <div
                    v-else-if="errorMessage"
                    class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                    role="alert"
                >
                    {{ errorMessage }}
                </div>
                <dl v-else-if="product" class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</dt>
                        <dd class="mt-1 font-medium text-slate-900">{{ product.sku }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                        <dd class="mt-1">
                            <span
                                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                                :class="product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                            >
                                {{ product.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ product.categoryName || '—' }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ product.supplierName || '—' }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cost price</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ formatCurrency(product.costPrice) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Selling price</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ formatCurrency(product.sellingPrice) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ formatNumber(product.quantity) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Reorder level</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ formatNumber(product.reorderLevel) }}</dd>
                    </div>
                    <div class="sm:col-span-2">
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</dt>
                        <dd class="mt-1 whitespace-pre-wrap text-sm text-slate-700">{{ product.description || 'No description provided.' }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ formatDate(product.createdAt) }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</dt>
                        <dd class="mt-1 text-sm text-slate-900">{{ formatDate(product.updatedAt) }}</dd>
                    </div>
                </dl>
            </div>
        </section>
    </div>
</template>
