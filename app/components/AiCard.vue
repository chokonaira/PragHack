<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  loading?: boolean
  error?: string | null
  footnote?: string
  demo?: boolean
}>(), {
  loading: false,
  error: null,
  footnote: undefined,
  demo: false
})

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section
    class="rounded-lg border border-secondary/30 bg-secondary/5 p-4 sm:p-5"
    :aria-label="title"
    aria-live="polite"
    :aria-busy="loading"
  >
    <header class="flex flex-wrap items-center gap-2">
      <UIcon
        name="i-lucide-sparkles"
        class="size-5 text-secondary"
        aria-hidden="true"
      />
      <h3 class="text-lg font-medium text-highlighted">
        {{ title }}
      </h3>
      <UBadge
        color="secondary"
        variant="subtle"
        size="sm"
      >
        AI
      </UBadge>
      <UBadge
        v-if="demo"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        Demo data
      </UBadge>
    </header>

    <div class="mt-3">
      <div
        v-if="loading"
        class="space-y-2"
        role="status"
      >
        <span class="sr-only">Loading</span>
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-11/12" />
        <USkeleton class="h-4 w-2/3" />
      </div>

      <div
        v-else-if="error"
        class="space-y-3"
      >
        <p class="text-sm text-default">
          {{ error }}
        </p>
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-refresh-cw"
          @click="emit('retry')"
        >
          Try again
        </UButton>
      </div>

      <slot v-else />
    </div>

    <p class="mt-4 text-xs text-muted">
      AI-generated. Check before you rely on it.<template v-if="footnote">
        {{ ' ' }}{{ footnote }}
      </template>
    </p>
  </section>
</template>
