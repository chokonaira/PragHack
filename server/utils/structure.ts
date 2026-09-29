import type { CreateMeta, Impact, StructuredTicket, TicketTypeCode } from '../../shared/types'
import { UNTRUSTED_DATA_RULE, asData, type Llm, type Validator } from './llm'

/** The contract limit (docs/contracts.md). The prompt asks for less because the model overshoots. */
export const SUMMARY_MAX = 80
const SUMMARY_ASK = 60
const DESCRIPTION_MAX = 4000
const MISSING_INFO_MAX = 3
const MISSING_INFO_ITEM_MAX = 200

const TICKET_TYPES: readonly TicketTypeCode[] = ['incident', 'request']
const IMPACTS: readonly Impact[] = ['low', 'medium', 'high']

export type LocationOption = CreateMeta['locations'][number]

/** The model's answer before the route adds `source`. */
export type StructuredTicketDraft = Omit<StructuredTicket, 'source'>

/**
 * System prompt for structure-ticket. Lists the real locations from create-meta
 * so the model can only pick one of them, and ends with the untrusted-data rule.
 */
export function buildStructurePrompt(locations: readonly LocationOption[]): string {
  const locationLines = locations.length > 0
    ? locations.map(l => `- "${l.value}" (${l.label})`).join('\n')
    : '- (no locations are available, so location must be null)'

  return [
    'You turn a customer\'s plain-language description of an IT problem or request into a structured support ticket.',
    'You only propose. A person reviews and edits your answer before anything is created.',
    '',
    'Return a JSON object with exactly these fields:',
    `- "summary": string, a short title of at most ${SUMMARY_ASK} characters, sentence case, no trailing period.`,
    '- "description": string, the problem restated clearly in the customer\'s own facts. Keep every concrete detail (dates, counts, names, error text). Add nothing that the customer did not say.',
    '- "ticketType": "incident" when something is broken or not working, "request" when the customer asks for something new (access, equipment, a change), or null when it is unclear.',
    '- "location": one of the location codes listed below, or null when the text does not clearly name one of them. Never guess and never use a code that is not in the list.',
    '- "impact": "low", "medium" or "high". High when the customer cannot work or customers cannot pay, medium when work is slowed or a workaround exists, low for routine requests and minor annoyances.',
    `- "missingInfo": array of 0 to ${MISSING_INFO_MAX} short questions the support team would still need answered (for example a device model, a serial number, when it started). Empty when nothing is missing.`,
    '',
    'Known locations:',
    locationLines,
    '',
    'If the text is meaningless, empty of facts or not a support matter, set ticketType and location to null, impact to "low", keep the summary and description honest about that, and ask in missingInfo what went wrong.',
    'Never invent facts, names, devices or locations. Write in the same language as the customer, in sentence case.',
    '',
    UNTRUSTED_DATA_RULE
  ].join('\n')
}

/** User message: the customer's text as delimited data only. */
export function buildStructureUser(text: string): string {
  return `Structure this customer message into a ticket.\n\n${asData('customer_message', text)}`
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned.length > 0 ? cleaned : null
}

/** Cuts at a word boundary and adds an ellipsis when `text` is longer than `max`. */
function clamp(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/**
 * Validator for the model's answer. Rejects (returns `null`) when a required
 * field is missing or `impact` is outside the enum, so `askJson` retries.
 * Normalises what can be normalised safely: whitespace, the summary length,
 * an unknown `ticketType` or `location` becomes `null`, `missingInfo` is
 * trimmed to three short questions.
 */
export function validateStructuredTicket(locations: readonly LocationOption[]): Validator<StructuredTicketDraft> {
  const allowed = new Set(locations.map(l => l.value))
  return (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const v = value as Record<string, unknown>

    const summary = cleanString(v.summary)
    if (summary === null) return null
    const description = cleanString(v.description)
    if (description === null) return null
    if (!IMPACTS.includes(v.impact as Impact)) return null

    const ticketType = TICKET_TYPES.includes(v.ticketType as TicketTypeCode) ? v.ticketType as TicketTypeCode : null
    const location = typeof v.location === 'string' && allowed.has(v.location) ? v.location : null

    const missingInfo = Array.isArray(v.missingInfo)
      ? v.missingInfo
          .map(cleanString)
          .filter((q): q is string => q !== null)
          .map(q => clamp(q, MISSING_INFO_ITEM_MAX))
          .slice(0, MISSING_INFO_MAX)
      : []

    return {
      summary: clamp(summary.replace(/[.!?]+$/, ''), SUMMARY_MAX),
      description: clamp(description, DESCRIPTION_MAX),
      ticketType,
      location,
      impact: v.impact as Impact,
      missingInfo
    }
  }
}

/** Asks the model for a structured ticket. Throws `AiError` when it cannot get a valid one. */
export async function structureWithLlm(llm: Llm, text: string, locations: readonly LocationOption[]): Promise<StructuredTicket> {
  const draft = await llm.askJson(buildStructurePrompt(locations), buildStructureUser(text), validateStructuredTicket(locations))
  return { ...draft, source: 'ai' }
}
