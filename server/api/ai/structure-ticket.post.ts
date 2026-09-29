import type { StructuredTicket } from '../../../shared/types'
import { structureDemo } from '../../data/demo-ai'
import { apiError } from '../../utils/errors'
import { isAiError, useLlm } from '../../utils/llm'
import { resolveProvider } from '../../utils/mode'
import { structureWithLlm, type LocationOption } from '../../utils/structure'

const TEXT_MAX = 4000

/**
 * POST /api/ai/structure-ticket (docs/contracts.md). Free text in, a
 * `StructuredTicket` out. Demo mode answers from the rule-based demo
 * structurer with `source: 'demo'`. Live mode asks the model, with the real
 * create-meta locations in the prompt, and answers 502 when the model fails.
 */
export default defineEventHandler(async (event): Promise<StructuredTicket | ReturnType<typeof apiError>> => {
  const body = await readBody<{ text?: unknown }>(event).catch(() => undefined)
  const raw = typeof body?.text === 'string' ? body.text : ''
  const text = raw.trim()
  if (!text) return apiError(event, 400, 'Describe the problem first')
  if (raw.length > TEXT_MAX) return apiError(event, 400, `That is too long, keep it under ${TEXT_MAX} characters`)

  const { provider, mode } = await resolveProvider(event)
  if (mode.mode === 'demo') return structureDemo(text)

  let locations: LocationOption[] = []
  try {
    locations = (await provider.meta()).locations
  } catch {
    // Without the options the model can only answer location: null, which is still a valid ticket.
    console.warn('[structure-ticket] create-meta unavailable, prompting without locations')
  }

  try {
    return await structureWithLlm(useLlm(), text, locations)
  } catch (err) {
    const code = isAiError(err) ? err.code : 'unknown'
    console.warn(`[structure-ticket] model failed: ${code}`)
    return apiError(event, 502, 'The AI could not structure this request')
  }
})
