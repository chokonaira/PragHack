import { resolveMode } from '../../../utils/mode'

// Demo only: plays the support side so the flow line can move during the demo.
export default defineEventHandler(async (event) => {
  if ((await resolveMode(event)).mode !== 'demo') {
    throw createError({ statusCode: 409, statusMessage: 'Only available in demo mode' })
  }
  const key = getRouterParam(event, 'key') ?? ''
  if (!/^[A-Z][A-Z0-9]+-[A-Za-z0-9-]+$/.test(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ticket key' })
  }
  try {
    return await demoProvider.advance(key)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }
})
