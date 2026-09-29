<script setup lang="ts">
import type { StatusId, Ticket } from '../../shared/types'

const { data: tickets, status, refresh } = await useFetch<Ticket[]>('/api/tickets', {
  key: 'tickets',
  default: () => []
})

const { openWith, lastCreated } = useNewRequest()
const route = useRoute()

const hasLoaded = ref(false)
watch(status, (value) => {
  if (value === 'success') hasLoaded.value = true
}, { immediate: true })
const firstLoad = computed(() => status.value === 'pending' && !hasLoaded.value)
const refreshing = computed(() => status.value === 'pending' && hasLoaded.value)
const reconnecting = computed(() => status.value === 'error' && hasLoaded.value)

const filter = ref<'all' | StatusId>('all')
const draft = ref('')

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
  openWith(draft.value)
  draft.value = ''
}

let poll: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (route.query.new) {
    openWith(typeof route.query.text === 'string' ? route.query.text : '')
    navigateTo({ path: '/', query: {} }, { replace: true })
  }
  poll = setInterval(() => {
    if (document.visibilityState === 'visible' && status.value !== 'pending') refresh()
  }, 3000)
})

onBeforeUnmount(() => clearInterval(poll))

watch(lastCreated, (key) => {
  if (key) setTimeout(() => (lastCreated.value = null), 3500)
})
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

        <PromptBox
          v-model="draft"
          class="mt-6"
          @submit="start"
        />
      </section>

      <section aria-labelledby="requests-title">
        <div class="flex items-center gap-3">
          <h2
            id="requests-title"
            class="text-2xl font-semibold tracking-tight text-highlighted"
          >
            My requests
          </h2>
          <span class="flex items-center gap-1.5 text-xs text-toned">
            <span
              class="relative flex size-2"
              aria-hidden="true"
            >
              <span
                v-if="refreshing"
                class="absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-flow-pulse"
                :class="reconnecting ? 'bg-warning' : 'bg-success'"
              />
              <span
                class="relative inline-flex size-2 rounded-full transition-colors duration-(--motion-base)"
                :class="reconnecting ? 'bg-warning' : 'bg-success'"
              />
            </span>
            {{ reconnecting ? 'Reconnecting' : 'Live' }}
          </span>
        </div>

        <div
          class="-mx-1 mt-4 flex gap-1 overflow-x-auto border-b border-default px-1"
          role="group"
          aria-label="Filter by status"
        >
          <button
            v-for="f in filters"
            :key="f.id"
            type="button"
            class="relative min-h-11 shrink-0 px-3 text-sm font-medium transition-colors duration-(--motion-fast) focus-visible:outline-2 focus-visible:outline-primary sm:min-h-10"
            :class="filter === f.id ? 'text-highlighted' : 'text-muted hover:text-default'"
            :aria-pressed="filter === f.id"
            @click="filter = f.id"
          >
            {{ f.label }}
            <span class="ms-1 tabular-nums text-muted">{{ f.count }}</span>
            <span
              v-if="filter === f.id"
              class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          v-if="firstLoad"
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
          v-else-if="status === 'error' && !hasLoaded"
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

        <TransitionGroup
          v-else
          name="row"
          tag="ul"
          class="mt-1 divide-y divide-default"
        >
          <li
            v-for="ticket in visible"
            :key="ticket.key"
          >
            <TicketRow
              :ticket="ticket"
              :highlight="ticket.key === lastCreated"
            />
          </li>
        </TransitionGroup>
      </section>
    </div>
  </UContainer>
</template>
