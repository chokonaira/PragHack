import type { NewTicket, TicketTypeCode } from '../../shared/types'

/** A valid key matches this shape (docs/contracts.md), e.g. "MCDTE-48". */
export const TICKET_KEY_RE = /^[A-Z][A-Z0-9]+-[A-Za-z0-9-]+$/

const TICKET_TYPES: TicketTypeCode[] = ['incident', 'request']

export type ValidationResult<T>
  = | { ok: true, value: T }
    | { ok: false, message: string }

export function validateNewTicket(body: unknown, allowedLocations: string[]): ValidationResult<NewTicket> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Request body must be an object' }
  }
  const b = body as Record<string, unknown>

  const summary = b.summary
  if (typeof summary !== 'string' || summary.trim().length < 1 || summary.length > 255) {
    return { ok: false, message: 'summary is required and must be 1 to 255 characters' }
  }
  if (b.description !== undefined && (typeof b.description !== 'string' || b.description.length > 4000)) {
    return { ok: false, message: 'description must be a string up to 4000 characters' }
  }
  const location = b.location
  if (typeof location !== 'string' || !allowedLocations.includes(location)) {
    return { ok: false, message: 'location is required and must be one of the create-meta options' }
  }
  if (b.ticketType !== undefined && !TICKET_TYPES.includes(b.ticketType as TicketTypeCode)) {
    return { ok: false, message: 'ticketType must be "incident" or "request"' }
  }

  return {
    ok: true,
    value: {
      summary: summary.trim(),
      description: typeof b.description === 'string' ? b.description : undefined,
      location,
      ticketType: b.ticketType as TicketTypeCode | undefined
    }
  }
}

export function validateCommentBody(body: unknown): ValidationResult<string> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Request body must be an object' }
  }
  const text = (body as Record<string, unknown>).body
  if (typeof text !== 'string' || text.trim().length < 1 || text.length > 2000) {
    return { ok: false, message: 'body is required and must be 1 to 2000 characters' }
  }
  return { ok: true, value: text }
}
