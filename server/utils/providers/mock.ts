import type {
  CreateMeta,
  NewTicket,
  Ticket,
  TicketComment,
  TicketDetail,
  TicketProvider
} from '../../../shared/types'
import type { ApiCreateMeta, ApiTicketCreated, ApiTicketDetail, ApiTicketListItem } from '../../types/api'
import { NotFoundError } from '../errors'
import { toCreateMeta, toCreateTicketRequest, toTicket, toTicketDetail } from '../mappers'
import type { Upstream } from '../upstream'

function stripToTicket(detail: TicketDetail): Ticket {
  const { reporter: _reporter, assignee: _assignee, comments: _comments, ...ticket } = detail
  return { ...ticket }
}

/**
 * Live mode. The mock is stateless (docs/api/README.md #3), so this keeps an in-memory
 * overlay of tickets we created and comments we added, and merges it on top of every read.
 */
export function createMockApiProvider(upstream: Upstream): TicketProvider {
  const localTickets = new Map<string, TicketDetail>()
  const overlayComments = new Map<string, TicketComment[]>()
  let nextLocalSuffix = 1

  async function fetchListItems(): Promise<ApiTicketListItem[]> {
    return (await upstream.get<ApiTicketListItem[]>('/api/v1/tickets')) ?? []
  }

  async function meta(): Promise<CreateMeta> {
    const raw = await upstream.get<ApiCreateMeta>('/api/v1/tickets/create-meta')
    if (!raw) throw new NotFoundError('create-meta')
    return toCreateMeta(raw)
  }

  return {
    async list() {
      const remote = (await fetchListItems()).map(item => toTicket(item))
      const local = [...localTickets.values()].map(stripToTicket)
      return [...local, ...remote].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },

    async get(key) {
      const local = localTickets.get(key)
      if (local) return { ...local, comments: [...local.comments] }

      const [detail, items] = await Promise.all([
        upstream.get<ApiTicketDetail>(`/api/v1/tickets/${encodeURIComponent(key)}`),
        fetchListItems()
      ])
      if (!detail) throw new NotFoundError(key)
      const listItem = items.find(i => i.issueKey === key)
      return toTicketDetail(detail, listItem, overlayComments.get(key) ?? [])
    },

    async create(input: NewTicket) {
      const createMeta = await meta()
      const created = await upstream.post<ApiTicketCreated>('/api/v1/tickets', toCreateTicketRequest(input, createMeta))

      // The mock always answers MCDTE-50 (docs/api/README.md #2), so make the key unique
      // against tickets we already hold locally, and label the ticket as local.
      const baseKey = created?.issueKey ?? 'MCDTE-50'
      let key = baseKey
      while (localTickets.has(key)) {
        key = `${baseKey}-${(nextLocalSuffix++).toString(36)}`
      }

      const now = new Date().toISOString()
      const detail: TicketDetail = {
        key,
        summary: input.summary,
        description: input.description ?? '',
        status: 'new',
        statusName: 'New',
        ticketType: input.ticketType === 'request' ? 'Service request' : 'Incident',
        location: input.location,
        createdAt: now,
        updatedAt: now,
        isLocal: true,
        reporter: 'You',
        assignee: 'Unassigned',
        comments: []
      }
      localTickets.set(key, detail)
      return stripToTicket(detail)
    },

    async addComment(key, body) {
      // The mock has no comment list (docs/api/README.md #10): one /updates call carries
      // it, but only the overlay makes it show up again on a later get().
      await upstream.post(`/api/v1/tickets/${encodeURIComponent(key)}/updates`, { comment: body })

      const comment: TicketComment = {
        id: `local-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        author: 'You',
        body,
        createdAt: new Date().toISOString(),
        fromCustomer: true
      }

      const local = localTickets.get(key)
      if (local) {
        local.comments = [...local.comments, comment]
        local.updatedAt = comment.createdAt
      } else {
        overlayComments.set(key, [...(overlayComments.get(key) ?? []), comment])
      }
      return comment
    },

    meta
  }
}
