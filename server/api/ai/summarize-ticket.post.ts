import { getDemoSummary } from '../../data/demo-ai'

// Demo branch of T-14. Marzieh adds the real LLM path and keeps this as the demo fallback.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ key?: string }>(event)
  const key = typeof body?.key === 'string' ? body.key : ''
  if (!/^[A-Z][A-Z0-9]+-[A-Za-z0-9-]+$/.test(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ticket key' })
  }
  try {
    const ticket = await demoProvider.get(key)
    return getDemoSummary(key, ticket.comments.length)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }
})
