<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
    product: {
        type: Object,
        default: null,
    },
    categories: {
        type: Array,
        default: () => [],
    },
    suppliers: {
        type: Array,
        default: () => [],
    },
    isSubmitting: {
        type: Boolean,
        default: false,
    },
    submitError: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['close', 'submit']);
const validationMessage = ref('');
const form = reactive({
    categoryId: '',
    supplierId: '',
    sku: '',
    name: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    reorderLevel: '',
});

watch(
    () => props.product,
    (product) => {
        form.categoryId = product?.categoryId ?? '';
        form.supplierId = product?.supplierId ?? '';
        form.sku = product?.sku ?? '';
        form.name = product?.name ?? '';
        form.description = product?.description ?? '';
        form.costPrice = product?.costPrice ?? '';
        form.sellingPrice = product?.sellingPrice ?? '';
        form.reorderLevel = product?.reorderLevel ?? '';
        validationMessage.value = '';
    },
    { immediate: true },
);

function submitForm() {
    validationMessage.value = '';

    const sku = form.sku.trim();
    const name = form.name.trim();
    const costPrice = Number(form.costPrice);
    const sellingPrice = Number(form.sellingPrice);
    const hasReorderLevel = form.reorderLevel !== '';
    const reorderLevel = hasReorderLevel ? Number(form.reorderLevel) : undefined;

    if (
        !form.categoryId ||
        !form.supplierId ||
        !sku ||
        !name ||
        form.costPrice === '' ||
        form.sellingPrice === ''
    ) {
        validationMessage.value =
            'Choose a category and supplier, and enter an SKU and product name.';
        return;
    }

    if (sku.length > 64 || name.length > 200) {
        validationMessage.value =
            'SKU must be at most 64 characters and product name at most 200 characters.';
        return;
    }

    if (
        !Number.isFinite(costPrice) ||
        costPrice < 0 ||
        !Number.isFinite(sellingPrice) ||
        sellingPrice < 0
    ) {
        validationMessage.value =
            'Cost and selling prices must be valid nonnegative numbers.';
        return;
    }

    if (sellingPrice < costPrice) {
        validationMessage.value =
            'Selling price must not be lower than cost price.';
        return;
    }

    if (
        form.description.trim().length > 2000 ||
        (hasReorderLevel &&
            (!Number.isInteger(reorderLevel) || reorderLevel < 0))
    ) {
        validationMessage.value =
            'Description must be at most 2,000 characters and reorder level must be a nonnegative integer.';
        return;
    }

    emit('submit', {
        categoryId: form.categoryId,
        supplierId: form.supplierId,
        sku: sku.toUpperCase(),
        name,
        description: form.description.trim() || null,
        costPrice,
        sellingPrice,
        ...(hasReorderLevel ? { reorderLevel } : {}),
    });
}
</script>

<template>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
        @click.self="emit('close')"
    >
        <section
            class="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
        >
            <header class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Product management
                    </p>
                    <h2 id="product-form-title" class="mt-1 text-xl font-semibold text-slate-900">
                        {{ product ? 'Edit product' : 'Create product' }}
                    </h2>
                </div>
                <button
                    type="button"
                    class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    aria-label="Close product form"
                    @click="emit('close')"
                >
                    <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true">
                        <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                    </svg>
                </button>
            </header>

            <form class="space-y-5 px-5 py-5 sm:px-7" @submit.prevent="submitForm">
                <div
                    v-if="validationMessage || submitError"
                    class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                    role="alert"
                >
                    {{ validationMessage || submitError }}
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                    <label class="space-y-1.5 text-sm font-medium text-slate-700">
                        Category <span class="text-rose-600" aria-hidden="true">*</span>
                        <select
                            v-model="form.categoryId"
                            required
                            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            <option value="" disabled>Select category</option>
                            <option v-for="category in categories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                    </label>
                    <label class="space-y-1.5 text-sm font-medium text-slate-700">
                        Supplier <span class="text-rose-600" aria-hidden="true">*</span>
                        <select
                            v-model="form.supplierId"
                            required
                            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            <option value="" disabled>Select supplier</option>
                            <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                                {{ supplier.name }}
                            </option>
                        </select>
                    </label>
                    <label class="space-y-1.5 text-sm font-medium text-slate-700">
                        SKU <span class="text-rose-600" aria-hidden="true">*</span>
                        <input
                            v-model="form.sku"
                            type="text"
                            maxlength="64"
                            autocomplete="off"
                            required
                            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 uppercase text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </label>
                    <label class="space-y-1.5 text-sm font-medium text-slate-700">
                        Product name <span class="text-rose-600" aria-hidden="true">*</span>
                        <input
                            v-model="form.name"
                            type="text"
                            maxlength="200"
                            required
                            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </label>
                    <label class="space-y-1.5 text-sm font-medium text-slate-700">
                        Cost price (₱) <span class="text-rose-600" aria-hidden="true">*</span>
                        <input
                            v-model="form.costPrice"
                            type="number"
                            min="0"
                            step="any"
                            required
                            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </label>
                    <label class="space-y-1.5 text-sm font-medium text-slate-700">
                        Selling price (₱) <span class="text-rose-600" aria-hidden="true">*</span>
                        <input
                            v-model="form.sellingPrice"
                            type="number"
                            min="0"
                            step="any"
                            required
                            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </label>
                    <label class="space-y-1.5 text-sm font-medium text-slate-700">
                        Reorder level
                        <input
                            v-model="form.reorderLevel"
                            type="number"
                            min="0"
                            step="1"
                            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </label>
                    <label class="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                        Description
                        <textarea
                            v-model="form.description"
                            rows="3"
                            maxlength="2000"
                            class="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        ></textarea>
                    </label>
                </div>

                <p class="text-xs text-slate-500">
                    Quantity is managed through Inventory and cannot be changed here.
                </p>

                <footer class="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        class="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        :disabled="isSubmitting"
                        @click="emit('close')"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="min-h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-wait disabled:opacity-60"
                        :disabled="isSubmitting"
                    >
                        {{ isSubmitting ? 'Saving…' : product ? 'Save changes' : 'Create product' }}
                    </button>
                </footer>
            </form>
        </section>
    </div>
</template>
