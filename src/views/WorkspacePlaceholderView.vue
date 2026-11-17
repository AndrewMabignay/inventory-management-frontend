<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p class="text-sm font-semibold text-blue-700">WORKSPACE</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {{ route.meta.title }}
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This section is ready for its management features.
        </p>
    </section>
</template>
