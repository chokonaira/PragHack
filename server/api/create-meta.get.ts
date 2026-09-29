import { apiError } from '../utils/errors'
import { resolveProvider } from '../utils/mode'
import { isApiError } from '../utils/upstream'

export default defineEventHandler(async (event) => {
  const { provider } = await resolveProvider(event)
  try {
    return await provider.meta()
  } catch (err) {
    return apiError(event, isApiError(err) ? err.status : 502, 'Could not load create options')
  }
})
