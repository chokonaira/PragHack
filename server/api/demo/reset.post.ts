import { demoProvider } from '../../utils/demoProvider'

export default defineEventHandler(async (event) => {
  await demoProvider.reset()
  event.node.res.statusCode = 204
  return null
})
