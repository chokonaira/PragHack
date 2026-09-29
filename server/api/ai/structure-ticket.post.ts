import { structureDemo } from '../../data/demo-ai'

// Demo branch of T-12. Florian adds the real LLM path and keeps this as the demo fallback.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ text?: string }>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) throw createError({ statusCode: 400, statusMessage: 'Describe the problem first' })
  if (text.length > 4000) throw createError({ statusCode: 400, statusMessage: 'That is too long, keep it under 4000 characters' })
  return structureDemo(text)
})
