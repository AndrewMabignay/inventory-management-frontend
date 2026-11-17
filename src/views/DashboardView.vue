<script setup>
import { computed, onMounted, ref } from 'vue';
import { getDashboardOverview } from '../services/dashboard.service.js';

const isLoading = ref(true);
const errorMessage = ref('');
const overview = ref(null);

const numberFormatter = new Intl.NumberFormat('en-PH');
const moneyFormatter = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const summaryCards = computed(() => {
    if (!overview.value) {
        return [];
    }

    const { summary, inventoryValue } = overview.value;

    return [
        {
            label: 'Total Products',
            value: formatNumber(summary.totalProducts),
            detail: `${formatNumber(summary.activeProducts)} active`,
            icon: 'products',
            color: 'blue',
        },
        {
            label: 'Total Categories',
            value: formatNumber(summary.totalCategories),
            detail: 'Product categories',
            icon: 'categories',
            color: 'violet',
        },
        {
            label: 'Total Suppliers',
            value: formatNumber(summary.totalSuppliers),
            detail: 'Registered suppliers',
            icon: 'suppliers',
            color: 'cyan',
        },
        {
            label: 'Low Stock Products',
            value: formatNumber(summary.lowStockProductCount),
            detail: 'At or below reorder level',
            icon: 'warning',
            color: 'amber',
        },
        {
            label: 'Total Inventory Value',
            value: formatCurrency(inventoryValue.totalCostValue),
            detail: `${formatCurrency(inventoryValue.totalPotentialSellingValue)} potential sales`,
            icon: 'value',
            color: 'emerald',
        },
    ];
});

const maxStockQuantity = computed(() =>
    Math.max(1, ...(overview.value?.stockLevels ?? []).map((product) => product.quantity)),
);

function formatNumber(value) {
    return Number.isFinite(value) ? numberFormatter.format(value) : '—';
}

function formatCurrency(value) {
    return Number.isFinite(value) ? `₱${moneyFormatter.format(value)}` : '—';
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function stockBarWidth(quantity) {
    if (quantity <= 0) {
        return '0%';
    }

    return `${Math.max(5, (quantity / maxStockQuantity.value) * 100)}%`;
}

function transactionLabel(type) {
    return type.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function transactionTone(type) {
    if (type === 'StockIn') {
        return 'bg-emerald-50 text-emerald-700';
    }

    if (type === 'StockOut') {
        return 'bg-amber-50 text-amber-700';
    }

    return 'bg-blue-50 text-blue-700';
}

async function loadDashboard() {
    isLoading.value = true;
    errorMessage.value = '';

    try {
        overview.value = await getDashboardOverview();
    } catch (error) {
        errorMessage.value =
            error.message || 'Unable to load dashboard data. Please try again.';
    } finally {
        isLoading.value = false;
    }
}

onMounted(loadDashboard);
</script>

<template>
    <div class="space-y-6">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-sm font-semibold text-blue-700">OVERVIEW</p>
                <h2 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Inventory at a glance
                </h2>
                <p class="mt-2 text-sm text-slate-600">
                    A live view of products, stock, and recent activity.
                </p>
            </div>
            <button
                type="button"
                class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-wait disabled:opacity-60"
                :disabled="isLoading"
                @click="loadDashboard"
            >
                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    class="size-4"
                    :class="{ 'animate-spin': isLoading }"
                    aria-hidden="true"
                >
                    <path
                        d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.8v3.8h-3.8"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                {{ isLoading ? 'Refreshing…' : 'Refresh' }}
            </button>
        </header>

        <section
            v-if="isLoading"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
            aria-label="Loading dashboard summary"
            aria-busy="true"
        >
            <div
                v-for="index in 5"
                :key="index"
                class="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            >
                <div class="h-3 w-24 rounded bg-slate-200" />
                <div class="mt-6 h-7 w-32 rounded bg-slate-200" />
                <div class="mt-4 h-3 w-28 rounded bg-slate-100" />
            </div>
        </section>

        <section
            v-else-if="errorMessage"
            class="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
            role="alert"
        >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 class="font-semibold text-red-800">Dashboard unavailable</h3>
                    <p class="mt-1 text-sm text-slate-600">{{ errorMessage }}</p>
                </div>
                <button
                    type="button"
                    class="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                    @click="loadDashboard"
                >
                    Try again
                </button>
            </div>
        </section>

        <template v-else-if="overview">
            <section
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
                aria-label="Inventory summary"
            >
                <article
                    v-for="card in summaryCards"
                    :key="card.label"
                    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
                            <p class="mt-3 truncate text-2xl font-semibold tracking-tight text-slate-900">
                                {{ card.value }}
                            </p>
                        </div>
                        <span
                            class="grid size-10 shrink-0 place-items-center rounded-xl"
                            :class="{
                                'bg-blue-50 text-blue-700': card.color === 'blue',
                                'bg-violet-50 text-violet-700': card.color === 'violet',
                                'bg-cyan-50 text-cyan-700': card.color === 'cyan',
                                'bg-amber-50 text-amber-700': card.color === 'amber',
                                'bg-emerald-50 text-emerald-700': card.color === 'emerald',
                            }"
                            aria-hidden="true"
                        >
                            <svg viewBox="0 0 24 24" fill="none" class="size-5">
                                <template v-if="card.icon === 'products'">
                                    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                    <path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v8.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                </template>
                                <template v-else-if="card.icon === 'categories'">
                                    <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                                    <rect x="13.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                                    <rect x="3.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                                    <rect x="13.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.7" />
                                </template>
                                <template v-else-if="card.icon === 'suppliers'">
                                    <path d="M4 20V8l8-5 8 5v12M2.5 20h19M9 20v-6h6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                                </template>
                                <template v-else-if="card.icon === 'warning'">
                                    <path d="M12 3.5 21 20H3l9-16.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                    <path d="M12 9v4m0 3.5h.01" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
                                </template>
                                <template v-else>
                                    <path d="M4 20V5m0 15h16M8 15v-4m4 4V7m4 8v-6m4 6V4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                                </template>
                            </svg>
                        </span>
                    </div>
                    <p class="mt-3 truncate text-xs text-slate-500">{{ card.detail }}</p>
                </article>
            </section>

            <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div>
                            <h3 class="font-semibold text-slate-900">Stock levels</h3>
                            <p class="mt-1 text-sm text-slate-500">Current quantity compared with reorder level</p>
                        </div>
                        <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {{ formatNumber(overview.summary.totalInventoryQuantity) }} units
                        </span>
                    </div>

                    <div v-if="overview.stockLevels.length" class="divide-y divide-slate-100">
                        <div
                            v-for="product in overview.stockLevels"
                            :key="product.id"
                            class="px-5 py-4 sm:px-6"
                        >
                            <div class="flex items-center justify-between gap-4">
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-medium text-slate-800">{{ product.name }}</p>
                                    <p class="mt-1 truncate text-xs text-slate-500">
                                        {{ product.sku }} <span aria-hidden="true">·</span> {{ product.categoryName }}
                                    </p>
                                </div>
                                <p class="shrink-0 text-right text-sm font-semibold text-slate-800">
                                    {{ formatNumber(product.quantity) }}
                                    <span class="text-xs font-normal text-slate-500">
                                        / {{ formatNumber(product.reorderLevel) }} reorder
                                    </span>
                                </p>
                            </div>
                            <div
                                class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                                role="img"
                                :aria-label="`${product.name}: ${product.quantity} units in stock`"
                            >
                                <div
                                    class="h-full rounded-full transition-all"
                                    :class="
                                        product.quantity <= product.reorderLevel
                                            ? 'bg-amber-500'
                                            : 'bg-blue-600'
                                    "
                                    :style="{ width: stockBarWidth(product.quantity) }"
                                />
                            </div>
                        </div>
                    </div>
                    <p v-else class="px-6 py-10 text-center text-sm text-slate-500">
                        No stock-level data is available yet.
                    </p>
                </article>

                <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div>
                            <h3 class="font-semibold text-slate-900">Low-stock products</h3>
                            <p class="mt-1 text-sm text-slate-500">Products at or below reorder level</p>
                        </div>
                        <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {{ formatNumber(overview.summary.lowStockProductCount) }} items
                        </span>
                    </div>

                    <div v-if="overview.lowStockProducts.length" class="overflow-x-auto">
                        <table class="w-full min-w-[28rem] text-left text-sm">
                            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th scope="col" class="px-5 py-3 font-semibold sm:px-6">Product</th>
                                    <th scope="col" class="px-4 py-3 font-semibold">In stock</th>
                                    <th scope="col" class="px-5 py-3 text-right font-semibold sm:px-6">Reorder at</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="product in overview.lowStockProducts" :key="product.id">
                                    <td class="px-5 py-3.5 sm:px-6">
                                        <p class="font-medium text-slate-800">{{ product.name }}</p>
                                        <p class="mt-1 text-xs text-slate-500">{{ product.sku }}</p>
                                    </td>
                                    <td class="px-4 py-3.5">
                                        <span class="font-semibold text-amber-700">
                                            {{ formatNumber(product.quantity) }}
                                        </span>
                                    </td>
                                    <td class="px-5 py-3.5 text-right text-slate-600 sm:px-6">
                                        {{ formatNumber(product.reorderLevel) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p v-else class="px-6 py-10 text-center text-sm text-slate-500">
                        No products are currently at or below their reorder level.
                    </p>
                </article>
            </section>

            <section class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h3 class="font-semibold text-slate-900">Recent inventory transactions</h3>
                        <p class="mt-1 text-sm text-slate-500">Latest stock activity recorded in the system</p>
                    </div>

                    <div v-if="overview.recentTransactions.length" class="overflow-x-auto">
                        <table class="w-full min-w-[38rem] text-left text-sm">
                            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th scope="col" class="px-5 py-3 font-semibold sm:px-6">Product</th>
                                    <th scope="col" class="px-4 py-3 font-semibold">Type</th>
                                    <th scope="col" class="px-4 py-3 font-semibold">Quantity</th>
                                    <th scope="col" class="px-4 py-3 font-semibold">User</th>
                                    <th scope="col" class="px-5 py-3 text-right font-semibold sm:px-6">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="transaction in overview.recentTransactions" :key="transaction.id">
                                    <td class="px-5 py-3.5 sm:px-6">
                                        <p class="font-medium text-slate-800">{{ transaction.product.name }}</p>
                                        <p class="mt-1 text-xs text-slate-500">{{ transaction.product.sku }}</p>
                                    </td>
                                    <td class="px-4 py-3.5">
                                        <span
                                            class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                                            :class="transactionTone(transaction.type)"
                                        >
                                            {{ transactionLabel(transaction.type) }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3.5 font-medium text-slate-700">
                                        {{ formatNumber(transaction.quantity) }}
                                    </td>
                                    <td class="px-4 py-3.5 text-slate-600">{{ transaction.user.name }}</td>
                                    <td class="px-5 py-3.5 text-right text-xs text-slate-500 sm:px-6">
                                        {{ formatDate(transaction.createdAt) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p v-else class="px-6 py-10 text-center text-sm text-slate-500">
                        No inventory transactions have been recorded yet.
                    </p>
                </article>

                <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h3 class="font-semibold text-slate-900">Most active products</h3>
                        <p class="mt-1 text-sm text-slate-500">Ranked by recorded stock movement</p>
                    </div>

                    <div v-if="overview.topProducts.length" class="divide-y divide-slate-100">
                        <div
                            v-for="(product, index) in overview.topProducts"
                            :key="product.id"
                            class="flex items-center gap-3 px-5 py-4 sm:px-6"
                        >
                            <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                                {{ index + 1 }}
                            </span>
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-medium text-slate-800">{{ product.name }}</p>
                                <p class="mt-1 truncate text-xs text-slate-500">
                                    {{ product.sku }} <span aria-hidden="true">·</span>
                                    {{ formatNumber(product.transactionCount) }} transactions
                                </p>
                            </div>
                            <p class="shrink-0 text-right text-sm font-semibold text-slate-800">
                                {{ formatNumber(product.totalQuantityMoved) }}
                                <span class="block text-xs font-normal text-slate-500">units moved</span>
                            </p>
                        </div>
                        <p class="px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6">
                            {{ overview.rankingMetric }}
                        </p>
                    </div>
                    <p v-else class="px-6 py-10 text-center text-sm text-slate-500">
                        No product stock movements have been recorded yet.
                    </p>
                </article>
            </section>
        </template>
    </div>
</template>
