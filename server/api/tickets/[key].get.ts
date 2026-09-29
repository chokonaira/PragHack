// Slice of T-05: one demo ticket with comments. T-05 adds live mode.
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') ?? ''
  if (!/^[A-Z][A-Z0-9]+-[A-Za-z0-9-]+$/.test(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ticket key' })
  }
  try {
    return await demoProvider.get(key)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }
})
