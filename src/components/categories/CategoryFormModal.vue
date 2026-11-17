<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
    category: {
        type: Object,
        default: null,
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
    name: '',
    description: '',
});

watch(
    () => props.category,
    (category) => {
        form.name = category?.name ?? '';
        form.description = category?.description ?? '';
        validationMessage.value = '';
    },
    { immediate: true },
);

function submitForm() {
    validationMessage.value = '';
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
        validationMessage.value = 'Enter a category name.';
        return;
    }

    if (name.length > 100 || description.length > 1000) {
        validationMessage.value =
            'Category name must be at most 100 characters and description at most 1,000 characters.';
        return;
    }

    emit('submit', {
        name,
        description: description || null,
    });
}
</script>

<template>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
        @click.self="emit('close')"
    >
        <section
            class="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
        >
            <header class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Category management
                    </p>
                    <h2 id="category-form-title" class="mt-1 text-xl font-semibold text-slate-900">
                        {{ category ? 'Edit category' : 'Create category' }}
                    </h2>
                </div>
                <button
                    type="button"
                    class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    aria-label="Close category form"
                    :disabled="isSubmitting"
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

                <label class="block space-y-1.5 text-sm font-medium text-slate-700">
                    Category name <span class="text-rose-600" aria-hidden="true">*</span>
                    <input
                        v-model="form.name"
                        type="text"
                        maxlength="100"
                        required
                        autofocus
                        class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </label>

                <label class="block space-y-1.5 text-sm font-medium text-slate-700">
                    Description
                    <textarea
                        v-model="form.description"
                        rows="4"
                        maxlength="1000"
                        class="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    ></textarea>
                    <span class="block text-xs font-normal text-slate-500">
                        Optional, up to 1,000 characters.
                    </span>
                </label>

                <footer class="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        class="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50"
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
                        {{ isSubmitting ? 'Saving…' : category ? 'Save changes' : 'Create category' }}
                    </button>
                </footer>
            </form>
        </section>
    </div>
</template>
