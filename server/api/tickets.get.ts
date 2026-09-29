import { apiError } from '../utils/errors'
import { resolveProvider } from '../utils/mode'
import { isApiError } from '../utils/upstream'

export default defineEventHandler(async (event) => {
  const { provider } = await resolveProvider(event)
  try {
    return await provider.list()
  } catch (err) {
    return apiError(event, isApiError(err) ? err.status : 502, isApiError(err) ? err.message : 'Could not load tickets')
  }
})
