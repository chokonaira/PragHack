import { describe, expect, it } from 'vitest'
import { shouldUseRealAi } from '../../server/utils/aiMode'

describe('shouldUseRealAi', () => {
  it('always uses the model in live mode', () => {
    expect(shouldUseRealAi('live', false, false)).toBe(true)
    expect(shouldUseRealAi('live', false, true)).toBe(true)
  })

  it('uses pre-written answers in demo mode by default', () => {
    expect(shouldUseRealAi('demo', false, true)).toBe(false)
    expect(shouldUseRealAi('demo', false, false)).toBe(false)
  })

  it('uses the model in demo mode only when AI live is on and a key exists', () => {
    expect(shouldUseRealAi('demo', true, true)).toBe(true)
    expect(shouldUseRealAi('demo', true, false)).toBe(false)
  })
})
