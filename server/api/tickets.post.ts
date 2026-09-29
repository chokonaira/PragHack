import { apiError } from '../utils/errors'
import { resolveProvider } from '../utils/mode'
import { isApiError } from '../utils/upstream'
import { validateNewTicket } from '../utils/validation'

export default defineEventHandler(async (event) => {
  const { provider } = await resolveProvider(event)

  let allowedLocations: string[]
  try {
    allowedLocations = (await provider.meta()).locations.map(l => l.value)
  } catch (err) {
    return apiError(event, isApiError(err) ? err.status : 502, 'Could not load create options')
  }

  const body = await readBody(event).catch(() => undefined)
  const validation = validateNewTicket(body, allowedLocations)
  if (!validation.ok) return apiError(event, 400, validation.message)

  try {
    const created = await provider.create(validation.value)
    event.node.res.statusCode = 201
    return created
  } catch (err) {
    return apiError(event, isApiError(err) ? err.status : 502, 'Could not create ticket')
  }
})
