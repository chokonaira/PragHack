// Shapes the ServiceBridge mock returns and accepts. Source of truth: docs/api/README.md.
// These are API types, not our domain types. Map them with server/utils/mappers.ts.

/** GET /api/v1/tickets */
export interface ApiTicketListItem {
  issueKey: string
  summary: string
  description: string
  status: string // status NAME, e.g. "In progress"
  ticketType: string // "Incident" | "Service request"
  projectKey: string
  location: string // restaurant code, e.g. "CZ_PHA_NUSLE"
  createdAt: string
  updatedAt: string
}

/** GET /api/v1/tickets/{issueKey} */
export interface ApiTicketDetail extends ApiTicketListItem {
  reporter: string
  assignee: string
  attachments: unknown[]
}

/** POST /api/v1/tickets, 201 */
export interface ApiTicketCreated {
  issueKey: string
  id: string
  summary: string
  status: string
}

/** POST /api/v1/tickets/{issueKey}/updates, 200 */
export interface ApiTicketUpdated {
  issueKey: string
  updatedAt: string
  status: string
}

/** GET /api/v1/statuses */
export interface ApiStatus {
  id: string
  name: string
  description: string
  categoryKey: 'new' | 'indeterminate' | 'done'
  categoryName: string
  iconUrl: string | null
}

/** GET /api/v1/tickets/create-meta */
export interface ApiCreateMeta {
  projectKey: string
  requestTypeId: string
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'textarea' | 'select'
    required: boolean
    options?: Array<{ value: string, label: string }>
  }>
}

/** POST /api/v1/tickets (our convention, the mock ignores bodies) */
export interface ApiCreateTicketRequest {
  projectKey: string
  requestTypeId: string
  summary: string
  description?: string
  location?: string
  ticketType?: string
}

/** POST /api/v1/tickets/{issueKey}/updates (our convention) */
export interface ApiTicketUpdateRequest {
  status?: string
  comment?: string
  assignee?: string
}

/** GET /health */
export interface ApiHealth {
  status: string
  version?: string
  environment?: string
}
