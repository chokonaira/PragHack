import { apiError, NotFoundError } from '../../utils/errors'
import { resolveProvider } from '../../utils/mode'
import { isApiError } from '../../utils/upstream'
import { TICKET_KEY_RE } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') ?? ''
  if (!TICKET_KEY_RE.test(key)) return apiError(event, 400, 'Invalid ticket key')

  const { provider } = await resolveProvider(event)
  try {
    return await provider.get(key)
  } catch (err) {
    if (err instanceof NotFoundError) return apiError(event, 404, 'Ticket not found')
    return apiError(event, isApiError(err) ? err.status : 502, isApiError(err) ? err.message : 'Could not load ticket')
  }
})
