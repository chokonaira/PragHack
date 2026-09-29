<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => (notFound.value ? 'We can\'t find that page' : 'Something went wrong on our side'))
const message = computed(() =>
  notFound.value
    ? 'The link may be old or mistyped. Your requests are safe, head back to the list.'
    : 'Try again in a moment. If it keeps happening, tell the person running the demo.'
)

useSeoMeta({ title: () => title.value })

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <UApp>
    <header class="border-b border-default">
      <UContainer class="flex h-16 items-center">
        <AppLogo />
      </UContainer>
    </header>
    <main class="py-20 sm:py-28">
      <UContainer class="max-w-xl">
        <p class="font-mono text-sm text-muted">
          {{ error.statusCode }}
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
          {{ title }}
        </h1>
        <p class="mt-4 text-base text-muted">
          {{ message }}
        </p>
        <UButton
          class="mt-8"
          size="lg"
          icon="i-lucide-arrow-left"
          @click="goHome"
        >
          Back to my requests
        </UButton>
      </UContainer>
    </main>
  </UApp>
</template>
