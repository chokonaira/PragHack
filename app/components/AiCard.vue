<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  loading?: boolean
  error?: string | null
  footnote?: string
  demo?: boolean
  refreshable?: boolean
}>(), {
  loading: false,
  error: null,
  footnote: undefined,
  demo: false,
  refreshable: false
})

const emit = defineEmits<{ retry: [], refresh: [] }>()
</script>

<template>
  <section
    class="rounded-xl border border-default bg-elevated/40 p-4 sm:p-5"
    :aria-label="title"
    aria-live="polite"
    :aria-busy="loading"
  >
    <header class="flex flex-wrap items-center gap-2">
      <h2 class="text-lg font-semibold tracking-tight text-highlighted">
        {{ title }}
      </h2>
      <UBadge
        v-if="demo"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        Demo data
      </UBadge>
      <UButton
        v-if="refreshable && !loading"
        class="ms-auto"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-refresh-cw"
        aria-label="Refresh"
        @click="emit('refresh')"
      />
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

    <p class="mt-4 text-xs text-toned">
      {{ footnote ?? 'Written by AI. Check the details before you act on them.' }}
    </p>
  </section>
</template>
