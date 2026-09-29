import type { AiSummary, TicketDetail } from '../../shared/types'

// One ticket with its comments. Await it in a page: const { data, error } = await useTicket(key)
export function useTicket(key: MaybeRefOrGetter<string>) {
  return useFetch<TicketDetail>(() => `/api/tickets/${toValue(key)}`)
}

// AI summary for a ticket. The cache key includes the ticket's updatedAt, so the summary
// is reused while the ticket is unchanged and refetched after any update.
export function useTicketSummary(key: MaybeRefOrGetter<string>, version: MaybeRefOrGetter<string | undefined>) {
  return useFetch<AiSummary>('/api/ai/summarize-ticket', {
    method: 'POST',
    body: computed(() => ({ key: toValue(key) })),
    key: computed(() => `summary:${toValue(key)}:${toValue(version) ?? 'unknown'}`),
    server: false,
    lazy: true
  })
}
