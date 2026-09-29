import type { AiSummary, TicketDetail } from '../../../shared/types'
import { UNTRUSTED_DATA_RULE, asData, type Llm } from '../llm'

const MAX_WHATS_HAPPENING_LENGTH = 600
const MAX_ACTION_LENGTH = 200

export function summarySystemPrompt(): string {
  return [
    'You summarize a customer support ticket for the customer who reported it, in plain, honest language.',
    '`whatsHappening` is 3 sentences or fewer and never invents events that are not in the ticket or its comments.',
    '`waitingOn` is "you" when the customer must act next, "support" when support must act next, "nobody" when the ticket is closed and nothing more is needed.',
    '`actionRequired` names the single thing the customer must do, or null when nothing is needed from them.',
    'Answer with a single JSON object: { "whatsHappening": string, "waitingOn": "you" | "support" | "nobody", "actionRequired": string | null }.',
    UNTRUSTED_DATA_RULE
  ].join(' ')
}

export function summaryUserPrompt(ticket: TicketDetail): string {
  const timeline = ticket.comments
    .map(c => `${c.fromCustomer ? 'Customer' : 'Support'} (${c.createdAt}): ${c.body}`)
    .join('\n')
  return [
    `Ticket ${ticket.key}, status "${ticket.statusName}".`,
    asData('summary', ticket.summary),
    asData('description', ticket.description),
    asData('comments', timeline || '(no comments yet)')
  ].join('\n\n')
}

type SummaryFields = Pick<AiSummary, 'whatsHappening' | 'waitingOn' | 'actionRequired'>

export function validateSummaryFields(value: unknown): SummaryFields | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (typeof v.whatsHappening !== 'string' || v.whatsHappening.trim().length === 0 || v.whatsHappening.length > MAX_WHATS_HAPPENING_LENGTH) return null
  if (v.waitingOn !== 'you' && v.waitingOn !== 'support' && v.waitingOn !== 'nobody') return null
  if (v.actionRequired !== null && (typeof v.actionRequired !== 'string' || v.actionRequired.length > MAX_ACTION_LENGTH)) return null
  return {
    whatsHappening: v.whatsHappening.trim(),
    waitingOn: v.waitingOn,
    actionRequired: typeof v.actionRequired === 'string' ? v.actionRequired.trim() : null
  }
}

/** A ticket with no comments has nothing to summarize. Answered directly, never guessed by the model. */
export function shortHistorySummary(commentCount: number): AiSummary {
  return {
    whatsHappening: 'This ticket has no updates yet, so there is not much to summarize.',
    waitingOn: 'support',
    actionRequired: null,
    basedOnComments: commentCount,
    generatedAt: new Date().toISOString(),
    source: 'ai'
  }
}

/** Real (non-demo) summary path. Callers handle `AiError` from `llm.askJson`. */
export async function summarizeTicket(ticket: TicketDetail, llm: Llm): Promise<AiSummary> {
  const commentCount = ticket.comments.length
  if (commentCount === 0) return shortHistorySummary(commentCount)

  const fields = await llm.askJson(summarySystemPrompt(), summaryUserPrompt(ticket), validateSummaryFields)
  return {
    ...fields,
    basedOnComments: commentCount,
    generatedAt: new Date().toISOString(),
    source: 'ai'
  }
}
