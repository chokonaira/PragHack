import { getDemoSummary } from '../../data/demo-ai'
import { summarizeTicket } from '../../utils/ai/summarize'
import { shouldUseRealAi } from '../../utils/aiMode'
import { NotFoundError, apiError } from '../../utils/errors'
import { isAiError, useLlm } from '../../utils/llm'
import { resolveProvider } from '../../utils/mode'
import { TICKET_KEY_RE } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ key?: string }>(event)
  const key = typeof body?.key === 'string' ? body.key : ''
  if (!TICKET_KEY_RE.test(key)) return apiError(event, 400, 'Invalid ticket key')

  const { provider, mode } = await resolveProvider(event)

  let ticket
  try {
    ticket = await provider.get(key)
  } catch (err) {
    if (err instanceof NotFoundError) return apiError(event, 404, 'Ticket not found')
    return apiError(event, 502, 'Could not load ticket')
  }

  const config = useRuntimeConfig()
  if (!shouldUseRealAi(mode.mode, Boolean(config.aiLive), Boolean(config.llm.apiKey))) {
    return getDemoSummary(key, ticket.comments.length, ticket.status)
  }

  try {
    return await summarizeTicket(ticket, useLlm())
  } catch (err) {
    if (isAiError(err)) return apiError(event, err.status, err.message)
    return apiError(event, 502, 'Could not generate summary')
  }
})
