<script setup lang="ts">
import type { Ticket } from '../../shared/types'

defineProps<{ ticket: Ticket }>()

const now = useState('now', () => Date.now())
</script>

<template>
  <NuxtLink
    :to="`/tickets/${ticket.key}`"
    class="-mx-3 block rounded-lg px-3 py-3.5 transition-colors duration-(--motion-fast) hover:bg-elevated/70 focus-visible:outline-2 focus-visible:outline-primary"
  >
    <div class="flex items-baseline justify-between gap-4">
      <span class="font-mono text-xs text-muted">{{ ticket.key }}</span>
      <span class="text-xs text-muted">Updated {{ relativeTime(ticket.updatedAt, now) }}</span>
    </div>
    <p class="mt-1 text-base font-medium text-highlighted">
      {{ ticket.summary }}
    </p>
    <div class="mt-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <TicketFlowTracker
        :status="ticket.status"
        compact
      />
      <span class="flex items-center gap-1.5 text-sm text-muted">
        <UIcon
          name="i-lucide-map-pin"
          class="size-4"
          aria-hidden="true"
        />
        {{ locationLabel(ticket.location) }}
      </span>
    </div>
  </NuxtLink>
</template>
