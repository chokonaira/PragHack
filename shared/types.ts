// Shared types. Source of truth: docs/contracts.md. Change both together.

export type StatusId = 'new' | 'in_progress' | 'resolved'
export type TicketTypeCode = 'incident' | 'request'
export type Impact = 'low' | 'medium' | 'high'

export interface Ticket {
  key: string
  summary: string
  description: string
  status: StatusId
  statusName: string
  ticketType: string
  location: string
  createdAt: string
  updatedAt: string
  isLocal?: boolean
}

export interface TicketComment {
  id: string
  author: string
  body: string
  createdAt: string
  fromCustomer: boolean
}

export interface TicketDetail extends Ticket {
  reporter: string
  assignee: string
  comments: TicketComment[]
}

export interface NewTicket {
  summary: string
  description?: string
  location: string
  ticketType?: TicketTypeCode
}

export interface CreateMeta {
  projectKey: string
  requestTypeId: string
  locations: Array<{ value: string, label: string }>
}

export interface TicketProvider {
  list(): Promise<Ticket[]>
  get(key: string): Promise<TicketDetail>
  create(input: NewTicket): Promise<Ticket>
  addComment(key: string, body: string): Promise<TicketComment>
  meta(): Promise<CreateMeta>
}

export type AiSource = 'ai' | 'demo'

export interface StructuredTicket {
  summary: string
  description: string
  ticketType: TicketTypeCode | null
  location: string | null
  impact: Impact
  missingInfo: string[]
  source: AiSource
}

export interface AiSummary {
  whatsHappening: string
  waitingOn: 'you' | 'support' | 'nobody'
  actionRequired: string | null
  basedOnComments: number
  generatedAt: string
  source: AiSource
}

export interface ApiErrorBody {
  message: string
  status: number
}
