import type { NewTicket } from '../../shared/types'

// Slice of T-05: create a ticket in the demo provider. T-05 adds live mode and the overlay.
export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<NewTicket>>(event)
  const summary = typeof body?.summary === 'string' ? body.summary.trim() : ''
  const location = typeof body?.location === 'string' ? body.location : ''
  if (!summary || summary.length > 255) {
    throw createError({ statusCode: 400, statusMessage: 'Add a short title (up to 255 characters)' })
  }
  if (!location) throw createError({ statusCode: 400, statusMessage: 'Choose a location' })
  const description = typeof body?.description === 'string' ? body.description.slice(0, 4000) : ''
  const ticketType = body?.ticketType === 'request' ? 'request' : 'incident'
  setResponseStatus(event, 201)
  return demoProvider.create({ summary, description, location, ticketType })
})
