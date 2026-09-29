<script setup lang="ts">
import type { StatusId, Ticket } from '../../shared/types'

const { data: tickets, status, refresh } = await useFetch<Ticket[]>('/api/tickets', {
  default: () => []
})

const filter = ref<'all' | StatusId>('all')
const draft = ref('')

const examples = [
  'My laptop keeps shutting down',
  'I can\'t log in',
  'The printer is offline'
]

const filters = computed(() => [
  { id: 'all' as const, label: 'All', count: tickets.value.length },
  { id: 'new' as const, label: 'Received', count: tickets.value.filter(t => t.status === 'new').length },
  { id: 'in_progress' as const, label: 'In progress', count: tickets.value.filter(t => t.status === 'in_progress').length },
  { id: 'resolved' as const, label: 'Resolved', count: tickets.value.filter(t => t.status === 'resolved').length }
])

const visible = computed(() =>
  tickets.value.filter(t => filter.value === 'all' || t.status === filter.value)
)

function start() {
  const text = draft.value.trim()
  navigateTo({ path: '/new', query: text ? { text } : {} })
}
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <div class="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <section
        class="lg:sticky lg:top-24 lg:self-start"
        aria-labelledby="hero-title"
      >
        <h1
          id="hero-title"
          class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl"
        >
          What went wrong?
        </h1>
        <p class="mt-3 text-base text-muted sm:text-lg">
          Tell us in your own words. We turn it into a request and keep you posted.
        </p>

        <div class="mt-6 rounded-xl border border-default bg-default p-2 shadow-sm transition-colors duration-(--motion-fast) focus-within:border-primary">
          <UTextarea
            v-model="draft"
            variant="none"
            autoresize
            :rows="3"
            :maxrows="8"
            size="lg"
            class="w-full"
            aria-label="Describe your problem"
            placeholder="For example: my laptop keeps shutting down since yesterday's update, three times this morning."
            @keydown.meta.enter.prevent="start"
            @keydown.ctrl.enter.prevent="start"
          />
          <div class="flex gap-2 overflow-x-auto px-2 pb-2 pt-1 lg:flex-wrap lg:overflow-visible">
            <UButton
              v-for="example in examples"
              :key="example"
              size="xs"
              color="neutral"
              variant="soft"
              class="shrink-0"
              @click="draft = example"
            >
              {{ example }}
            </UButton>
          </div>
          <UButton
            block
            size="lg"
            icon="i-lucide-sparkles"
            @click="start"
          >
            Create request
          </UButton>
        </div>
      </section>

      <section aria-labelledby="requests-title">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="requests-title"
            class="text-2xl font-semibold tracking-tight text-highlighted"
          >
            My requests
          </h2>
          <div
            class="flex flex-wrap gap-1"
            role="group"
            aria-label="Filter by status"
          >
            <UButton
              v-for="f in filters"
              :key="f.id"
              size="sm"
              :color="filter === f.id ? 'primary' : 'neutral'"
              :variant="filter === f.id ? 'soft' : 'ghost'"
              :aria-pressed="filter === f.id"
              @click="filter = f.id"
            >
              {{ f.label }}
              <span class="tabular-nums text-muted">{{ f.count }}</span>
            </UButton>
          </div>
        </div>

        <div
          v-if="status === 'pending'"
          class="mt-4 space-y-5"
          role="status"
        >
          <span class="sr-only">Loading your requests</span>
          <div
            v-for="n in 4"
            :key="n"
            class="space-y-3 py-2"
          >
            <USkeleton class="h-3 w-24" />
            <USkeleton class="h-5 w-4/5" />
            <USkeleton class="h-3 w-40" />
          </div>
        </div>

        <UAlert
          v-else-if="status === 'error'"
          class="mt-4"
          color="error"
          variant="subtle"
          title="Couldn't load your requests"
          description="Check your connection and try again."
          :actions="[{ label: 'Try again', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <div
          v-else-if="!visible.length"
          class="mt-6 rounded-lg border border-dashed border-default p-8 text-center"
        >
          <p class="font-medium text-highlighted">
            No requests here yet
          </p>
          <p class="mt-1 text-sm text-muted">
            Describe a problem and it will show up in this list.
          </p>
        </div>

        <ul
          v-else
          class="mt-1 divide-y divide-default"
        >
          <li
            v-for="ticket in visible"
            :key="ticket.key"
          >
            <TicketRow :ticket="ticket" />
          </li>
        </ul>
      </section>
    </div>
  </UContainer>
</template>
