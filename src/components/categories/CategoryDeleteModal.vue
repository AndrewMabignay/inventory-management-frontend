<script setup>
defineProps({
    category: {
        type: Object,
        required: true,
    },
    isDeleting: {
        type: Boolean,
        default: false,
    },
    errorMessage: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['close', 'confirm']);
</script>

<template>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
        @click.self="!isDeleting && emit('close')"
    >
        <section
            class="my-auto w-full max-w-md rounded-2xl bg-white shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            aria-describedby="delete-category-description"
        >
            <div class="p-5 sm:p-6">
                <div class="flex items-start gap-4">
                    <span class="grid size-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-700">
                        <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true">
                            <path d="M4.5 6h11m-9.5 0 .6 10h7.8l.6-10M8 6V4h4v2m-3 3v4m2-4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </span>
                    <div class="min-w-0">
                        <h2 id="delete-category-title" class="text-lg font-semibold text-slate-900">
                            Delete category?
                        </h2>
                        <p id="delete-category-description" class="mt-2 text-sm leading-6 text-slate-600">
                            This will permanently delete
                            <span class="font-semibold text-slate-900">{{ category.name }}</span>.
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div
                    v-if="errorMessage"
                    class="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                    role="alert"
                >
                    {{ errorMessage }}
                </div>

                <footer class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        class="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50"
                        :disabled="isDeleting"
                        @click="emit('close')"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-wait disabled:opacity-60"
                        :disabled="isDeleting"
                        @click="emit('confirm')"
                    >
                        {{ isDeleting ? 'Deleting…' : 'Delete category' }}
                    </button>
                </footer>
            </div>
        </section>
    </div>
</template>
