<script setup lang="ts">
// /new opens the New request modal on the home page.
const route = useRoute()
await navigateTo(
  { path: '/', query: { new: '1', ...(typeof route.query.text === 'string' ? { text: route.query.text } : {}) } },
  { replace: true }
)
</script>

<template>
  <div />
</template>
