import type { Ticket } from '../../shared/types'

// The full request list. Await it in a page: const { data, status, refresh } = useTickets()
export function useTickets() {
  return useFetch<Ticket[]>('/api/tickets', {
    key: 'tickets',
    default: () => []
  })
}
