import type {
  CreateMeta,
  NewTicket,
  Ticket,
  TicketComment,
  TicketDetail,
  TicketProvider
} from '../../../shared/types'
import { buildDemoTickets, DEMO_LOCATIONS } from '../../data/demo'
import type { DemoState, DemoStore } from '../demoStore'
import { NotFoundError } from '../errors'

export interface FixtureProvider extends TicketProvider {
  reset(): Promise<void>
  // Demo only: plays the support side. new -> in progress -> resolved, with a support reply.
  advance(key: string): Promise<TicketDetail>
}

function toTicket(detail: TicketDetail): Ticket {
  const { reporter: _reporter, assignee: _assignee, comments: _comments, ...ticket } = detail
  return { ...ticket }
}

function freshState(): DemoState {
  return { tickets: buildDemoTickets(), nextKey: 50, nextComment: 1 }
}

/**
 * Demo provider. State lives in this instance's memory, or in the store when one is given,
 * so that every serverless instance sees the same tickets.
 */
export function createFixtureProvider(store?: DemoStore): FixtureProvider {
  let state = freshState()
  let seeded = false

  async function hydrate() {
    if (!store) return
    const stored = await store.load()
    if (stored) {
      state = stored
      seeded = true
    } else if (!seeded) {
      seeded = true
      await store.save(state)
    }
  }

  async function commit() {
    if (store) await store.save(state)
  }

  const find = (key: string): TicketDetail => {
    const found = state.tickets.find(t => t.key === key)
    if (!found) throw new NotFoundError(key)
    return found
  }

  return {
    async list() {
      await hydrate()
      return state.tickets
        .map(toTicket)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },

    async get(key) {
      await hydrate()
      const found = find(key)
      return { ...found, comments: [...found.comments] }
    },

    async create(input: NewTicket) {
      await hydrate()
      const now = new Date().toISOString()
      const created: TicketDetail = {
        key: `MCDTE-${state.nextKey++}`,
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
      state.tickets = [created, ...state.tickets]
      await commit()
      return toTicket(created)
    },

    async addComment(key, body): Promise<TicketComment> {
      await hydrate()
      const found = find(key)
      const created: TicketComment = {
        id: `local-${state.nextComment++}`,
        author: found.reporter,
        body,
        createdAt: new Date().toISOString(),
        fromCustomer: true
      }
      found.comments = [...found.comments, created]
      found.updatedAt = created.createdAt
      await commit()
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
      await hydrate()
      const found = find(key)
      const now = new Date().toISOString()
      if (found.status === 'new') {
        found.status = 'in_progress'
        found.statusName = 'In progress'
        found.assignee = 'IT Support'
        found.comments = [...found.comments, {
          id: `support-${state.nextComment++}`,
          author: 'IT Support',
          body: 'We\'ve picked this up and started looking into it. We\'ll update you here as soon as we know more.',
          createdAt: now,
          fromCustomer: false
        }]
      } else if (found.status === 'in_progress') {
        found.status = 'resolved'
        found.statusName = 'Resolved'
        found.comments = [...found.comments, {
          id: `support-${state.nextComment++}`,
          author: 'IT Support',
          body: 'This is fixed now. Let us know if it happens again and we\'ll reopen it.',
          createdAt: now,
          fromCustomer: false
        }]
      }
      found.updatedAt = now
      await commit()
      return { ...found, comments: [...found.comments] }
    },

    async reset() {
      state = freshState()
      seeded = true
      await commit()
    }
  }
}
