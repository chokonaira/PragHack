import type { ApiErrorBody } from '../../shared/types'

// Nitro pins its own h3 internally; importing H3Event from the top-level 'h3'
// package can resolve a different (incompatible) copy under pnpm. Deriving the
// event type from an already-ambient nitro function keeps it version-consistent.
// (getCookie, unlike setResponseStatus, has a single overload, so this picks
// the event type cleanly.)
type ServerEvent = Parameters<typeof getCookie>[0]

/** Thrown by a provider when a ticket key does not exist (demo mode only; the live mock echoes any key back). */
export class NotFoundError extends Error {
  readonly status = 404
  constructor(key: string) {
    super(`Ticket ${key} not found`)
    this.name = 'NotFoundError'
  }
}

/**
 * Writes `{ message, status }` directly onto the response and returns it, so every
 * route answers with exactly the shape docs/contracts.md defines, regardless of Nitro's
 * default error envelope. Call as `return apiError(event, 400, '...')`, not `throw`.
 */
export function apiError(event: ServerEvent, status: number, message: string): ApiErrorBody {
  // Not setResponseStatus(): nitropack's own h3 version and the top-level 'h3'
  // package can disagree under pnpm, which makes that helper's types unreliable
  // here. The raw Node response is version-agnostic.
  event.node.res.statusCode = status
  return { message, status }
}
