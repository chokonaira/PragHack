<script setup lang="ts">
// Placeholder so "New request" never 404s. T-13 (AI creator) replaces this page.
const route = useRoute()
const text = ref(typeof route.query.text === 'string' ? route.query.text : '')
</script>

<template>
  <UContainer class="max-w-3xl py-12 sm:py-16">
    <h1 class="text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
      New request
    </h1>
    <p class="mt-3 max-w-prose text-muted">
      The AI creator is being built next. It will read what you write here and fill in the request for you to review.
    </p>
    <UTextarea
      v-model="text"
      class="mt-6 w-full"
      :rows="5"
      autoresize
      aria-label="Describe your problem"
      placeholder="Describe what happened"
    />
  </UContainer>
</template>
