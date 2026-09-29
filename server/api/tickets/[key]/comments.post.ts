import { apiError, NotFoundError } from '../../../utils/errors'
import { resolveProvider } from '../../../utils/mode'
import { isApiError } from '../../../utils/upstream'
import { TICKET_KEY_RE, validateCommentBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') ?? ''
  if (!TICKET_KEY_RE.test(key)) return apiError(event, 400, 'Invalid ticket key')

  const body = await readBody(event).catch(() => undefined)
  const validation = validateCommentBody(body)
  if (!validation.ok) return apiError(event, 400, validation.message)

  const { provider } = await resolveProvider(event)
  try {
    const comment = await provider.addComment(key, validation.value)
    event.node.res.statusCode = 201
    return comment
  } catch (err) {
    if (err instanceof NotFoundError) return apiError(event, 404, 'Ticket not found')
    return apiError(event, isApiError(err) ? err.status : 502, 'Could not add comment')
  }
})
