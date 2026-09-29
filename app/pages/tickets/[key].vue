<script setup lang="ts">
import type { AiSummary, TicketDetail } from '../../../shared/types'

const route = useRoute()
const key = computed(() => String(route.params.key))
const now = useState('now', () => Date.now())

const { data: ticket, error, refresh: refreshTicket } = await useFetch<TicketDetail>(() => `/api/tickets/${key.value}`)
const { data: mode } = useFetch<{ mode: 'demo' | 'live' }>('/api/mode')
const advancing = ref(false)

async function advance() {
  advancing.value = true
  try {
    await $fetch(`/api/tickets/${key.value}/advance`, { method: 'POST' })
    await Promise.all([refreshTicket(), refreshSummary(), refreshNuxtData('tickets')])
  } finally {
    advancing.value = false
  }
}

const { data: summary, status: summaryStatus, error: summaryError, refresh: refreshSummary } = useFetch<AiSummary>(
  '/api/ai/summarize-ticket',
  { method: 'POST', body: computed(() => ({ key: key.value })), server: false, lazy: true }
)

useSeoMeta({ title: () => (ticket.value ? `${ticket.value.key} ${ticket.value.summary}` : 'Request not found') })

const times = computed(() => {
  if (!ticket.value) return {}
  return {
    new: `Opened ${relativeTime(ticket.value.createdAt, now.value)}`,
    ...(ticket.value.status === 'resolved' ? { resolved: relativeTime(ticket.value.updatedAt, now.value) } : {})
  }
})

const waitingLabel = { you: 'You', support: 'Support', nobody: 'Nobody' } as const
</script>

<template>
  <UContainer class="max-w-5xl py-10 sm:py-14">
    <UButton
      to="/"
      color="neutral"
      variant="link"
      icon="i-lucide-arrow-left"
      class="-ms-2.5"
    >
      My requests
    </UButton>

    <UAlert
      v-if="error || !ticket"
      class="mt-6"
      color="error"
      variant="subtle"
      title="We couldn't find that request"
      description="It may have been removed, or the link is wrong. Go back to your requests and pick one from the list."
    />

    <template v-else>
      <header class="mt-4">
        <p class="font-mono text-sm text-muted">
          {{ ticket.key }}
        </p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
          {{ ticket.summary }}
        </h1>
        <div class="mt-8 max-w-2xl">
          <TicketFlowTracker
            :status="ticket.status"
            :times="times"
          />
        </div>
      </header>

      <div class="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div class="min-w-0 space-y-10">
          <AiCard
            title="What's happening?"
            :loading="summaryStatus === 'pending' || summaryStatus === 'idle'"
            :error="summaryError ? 'Couldn\'t summarize this request. Try again.' : null"
            :demo="summary?.source === 'demo'"
            :footnote="summary ? `Based on ${summary.basedOnComments} ${summary.basedOnComments === 1 ? 'comment' : 'comments'}.` : undefined"
            @retry="refreshSummary()"
          >
            <template v-if="summary">
              <p class="max-w-prose text-base leading-relaxed text-highlighted">
                {{ summary.whatsHappening }}
              </p>
              <dl class="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                <dt class="text-toned">
                  Waiting on
                </dt>
                <dd class="font-medium text-highlighted">
                  {{ waitingLabel[summary.waitingOn] }}
                </dd>
                <dt class="text-toned">
                  Action for you
                </dt>
                <dd class="font-medium text-highlighted">
                  {{ summary.actionRequired ?? 'Nothing needed right now' }}
                </dd>
              </dl>
            </template>
          </AiCard>

          <section aria-labelledby="description-title">
            <h2
              id="description-title"
              class="text-xl font-semibold tracking-tight text-highlighted"
            >
              What you reported
            </h2>
            <p class="mt-3 max-w-prose text-base leading-relaxed text-default">
              {{ ticket.description }}
            </p>
          </section>

          <section aria-labelledby="timeline-title">
            <h2
              id="timeline-title"
              class="text-xl font-semibold tracking-tight text-highlighted"
            >
              Updates
            </h2>
            <ol class="mt-5 space-y-7 border-s border-default ps-6">
              <li
                v-for="c in ticket.comments"
                :key="c.id"
                class="relative"
              >
                <span
                  class="absolute -start-[1.9rem] top-1.5 size-2.5 rounded-full border-2 border-default"
                  :class="c.fromCustomer ? 'bg-primary' : 'bg-accented'"
                  aria-hidden="true"
                />
                <p class="flex items-baseline gap-2 text-sm">
                  <span class="font-medium text-highlighted">{{ c.fromCustomer ? 'You' : c.author }}</span>
                  <span class="text-muted">{{ relativeTime(c.createdAt, now) }}</span>
                </p>
                <p class="mt-1 max-w-prose text-base leading-relaxed text-default">
                  {{ c.body }}
                </p>
              </li>
              <li class="relative">
                <span
                  class="absolute -start-[1.9rem] top-1.5 size-2.5 rounded-full border-2 border-default bg-accented"
                  aria-hidden="true"
                />
                <p class="flex items-baseline gap-2 text-sm">
                  <span class="font-medium text-highlighted">Request opened</span>
                  <span class="text-muted">{{ relativeTime(ticket.createdAt, now) }}</span>
                </p>
              </li>
            </ol>
            <p
              v-if="!ticket.comments.length"
              class="mt-4 text-sm text-muted"
            >
              No updates yet. Support will reply here.
            </p>
          </section>
        </div>

        <aside
          aria-label="Request details"
          class="lg:sticky lg:top-24 lg:self-start"
        >
          <dl class="space-y-4 text-sm">
            <div>
              <dt class="text-muted">
                Location
              </dt>
              <dd class="mt-0.5 font-medium text-highlighted">
                {{ locationLabel(ticket.location) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Type
              </dt>
              <dd class="mt-0.5 font-medium text-highlighted">
                {{ ticket.ticketType }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Reported by
              </dt>
              <dd class="mt-0.5 font-medium text-highlighted">
                {{ ticket.reporter }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">
                Handled by
              </dt>
              <dd class="mt-0.5 font-medium text-highlighted">
                {{ ticket.assignee }}
              </dd>
            </div>
          </dl>
          <div
            v-if="mode?.mode === 'demo'"
            class="mt-8 rounded-lg border border-dashed border-default p-4"
          >
            <p class="text-sm font-medium text-highlighted">
              Demo control
            </p>
            <p class="mt-1 text-sm text-toned">
              In real life support moves your request forward. Play support here.
            </p>
            <UButton
              class="mt-3"
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-headset"
              :loading="advancing"
              :disabled="ticket.status === 'resolved'"
              @click="advance"
            >
              {{ ticket.status === 'resolved' ? 'Already resolved' : 'Simulate support update' }}
            </UButton>
          </div>
        </aside>
      </div>
    </template>
  </UContainer>
</template>
