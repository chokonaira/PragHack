import type {
  CreateMeta,
  NewTicket,
  Ticket,
  TicketComment,
  TicketDetail,
  TicketProvider
} from '../../../shared/types'
import { buildDemoTickets, DEMO_LOCATIONS } from '../../data/demo'
import { NotFoundError } from '../errors'

export interface FixtureProvider extends TicketProvider {
  reset(): void
  // Demo only: plays the support side. new -> in progress -> resolved, with a support reply.
  advance(key: string): Promise<TicketDetail>
}

function toTicket(detail: TicketDetail): Ticket {
  const { reporter: _reporter, assignee: _assignee, comments: _comments, ...ticket } = detail
  return { ...ticket }
}

// In-memory provider for demo mode. Changes live until reset() or a server restart.
export function createFixtureProvider(): FixtureProvider {
  let tickets = buildDemoTickets()
  let nextKey = 50
  let nextComment = 1

  const find = (key: string): TicketDetail => {
    const found = tickets.find(t => t.key === key)
    if (!found) throw new NotFoundError(key)
    return found
  }

  return {
    async list() {
      return tickets
        .map(toTicket)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },

    async get(key) {
      const found = find(key)
      return { ...found, comments: [...found.comments] }
    },

    async create(input: NewTicket) {
      const now = new Date().toISOString()
      const created: TicketDetail = {
        key: `MCDTE-${nextKey++}`,
        summary: input.summary,
        description: input.description ?? '',
        status: 'new',
        statusName: 'New',
        ticketType: input.ticketType === 'request' ? 'Service request' : 'Incident',
        location: input.location,
        createdAt: now,
        updatedAt: now,
        isLocal: true,
        reporter: 'Alex Novak',
        assignee: 'Unassigned',
        comments: []
      }
      tickets = [created, ...tickets]
      return toTicket(created)
    },

    async addComment(key, body): Promise<TicketComment> {
      const found = find(key)
      const created: TicketComment = {
        id: `local-${nextComment++}`,
        author: found.reporter,
        body,
        createdAt: new Date().toISOString(),
        fromCustomer: true
      }
      found.comments = [...found.comments, created]
      found.updatedAt = created.createdAt
      return created
    },

    async meta(): Promise<CreateMeta> {
      return {
        projectKey: 'MCDTE',
        requestTypeId: '101',
        locations: DEMO_LOCATIONS.map(l => ({ ...l }))
      }
    },

    async advance(key) {
      const found = find(key)
      const now = new Date().toISOString()
      if (found.status === 'new') {
        found.status = 'in_progress'
        found.statusName = 'In progress'
        found.assignee = 'IT Support'
        found.comments = [...found.comments, {
          id: `support-${nextComment++}`,
          author: 'IT Support',
          body: 'We\'ve picked this up and started looking into it. We\'ll update you here as soon as we know more.',
          createdAt: now,
          fromCustomer: false
        }]
      } else if (found.status === 'in_progress') {
        found.status = 'resolved'
        found.statusName = 'Resolved'
        found.comments = [...found.comments, {
          id: `support-${nextComment++}`,
          author: 'IT Support',
          body: 'This is fixed now. Let us know if it happens again and we\'ll reopen it.',
          createdAt: now,
          fromCustomer: false
        }]
      }
      found.updatedAt = now
      return { ...found, comments: [...found.comments] }
    },

    reset() {
      tickets = buildDemoTickets()
      nextKey = 50
      nextComment = 1
    }
  }
}
