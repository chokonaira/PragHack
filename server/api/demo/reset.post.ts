import { demoProvider } from '../../utils/demoProvider'

export default defineEventHandler((event) => {
  demoProvider.reset()
  event.node.res.statusCode = 204
  return null
})
