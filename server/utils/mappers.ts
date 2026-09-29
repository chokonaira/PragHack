import type { CreateMeta, NewTicket, StatusId, Ticket, TicketComment, TicketDetail } from '../../shared/types'
import type { ApiCreateMeta, ApiCreateTicketRequest, ApiTicketDetail, ApiTicketListItem } from '../types/api'

export const STATUS_NAMES: Record<StatusId, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved'
}

const STATUS_BY_NORMALISED_NAME: Record<string, StatusId> = {
  'new': 'new',
  'in progress': 'in_progress',
  'resolved': 'resolved'
}

/**
 * The mock puts the status NAME ("In progress") on a ticket, not the id.
 * Match case-insensitively, treating spaces, underscores and dashes alike.
 * Unknown names fall back to `new` so a ticket never disappears from the list.
 */
export function statusIdFromName(name: string | null | undefined): StatusId {
  const normalised = (name ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ')
  return STATUS_BY_NORMALISED_NAME[normalised] ?? 'new'
}

export function toTicket(item: ApiTicketListItem, overrides: Partial<Ticket> = {}): Ticket {
  return {
    key: item.issueKey,
    summary: item.summary,
    description: item.description ?? '',
    status: statusIdFromName(item.status),
    statusName: item.status,
    ticketType: item.ticketType,
    location: item.location,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ...overrides
  }
}

/**
 * The detail endpoint returns placeholder text ("Mock ticket MCDTE-48"), so summary,
 * description and status come from the list item when we have one. Reporter and
 * assignee come from the detail. Comments come from our overlay, the mock has none.
 */
export function toTicketDetail(
  detail: ApiTicketDetail,
  listItem: ApiTicketListItem | undefined,
  comments: TicketComment[] = []
): TicketDetail {
  const base = toTicket(listItem ?? detail)
  return {
    ...base,
    key: detail.issueKey,
    reporter: detail.reporter,
    assignee: detail.assignee,
    comments: [...comments]
  }
}

export function toCreateMeta(meta: ApiCreateMeta): CreateMeta {
  const locationField = meta.fields.find(f => f.key === 'location')
  return {
    projectKey: meta.projectKey,
    requestTypeId: meta.requestTypeId,
    locations: (locationField?.options ?? []).map(o => ({ value: o.value, label: o.label }))
  }
}

export function toCreateTicketRequest(input: NewTicket, meta: CreateMeta): ApiCreateTicketRequest {
  const body: ApiCreateTicketRequest = {
    projectKey: meta.projectKey,
    requestTypeId: meta.requestTypeId,
    summary: input.summary,
    location: input.location
  }
  if (input.description !== undefined) body.description = input.description
  if (input.ticketType !== undefined) body.ticketType = input.ticketType
  return body
}
