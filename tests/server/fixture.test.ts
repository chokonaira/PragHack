import { describe, expect, it } from 'vitest'
import { createFixtureProvider } from '../../server/utils/providers/fixture'

describe('fixture provider', () => {
  it('lists the demo tickets, newest update first', async () => {
    const list = await createFixtureProvider().list()
    expect(list).toHaveLength(8)
    expect(list[0]!.updatedAt >= list[1]!.updatedAt).toBe(true)
  })

  it('creates a local ticket with a unique key', async () => {
    const p = createFixtureProvider()
    const a = await p.create({ summary: 'A', location: 'CZ_PHA_NUSLE' })
    const b = await p.create({ summary: 'B', location: 'CZ_PHA_NUSLE' })
    expect(a.isLocal).toBe(true)
    expect(a.status).toBe('new')
    expect(a.key).not.toBe(b.key)
    expect(await p.list()).toHaveLength(10)
  })

  it('advances new to in progress to resolved with a support reply each time', async () => {
    const p = createFixtureProvider()
    const first = await p.advance('MCDTE-49')
    expect(first.status).toBe('in_progress')
    expect(first.comments.at(-1)!.fromCustomer).toBe(false)
    const second = await p.advance('MCDTE-49')
    expect(second.status).toBe('resolved')
    expect(second.comments).toHaveLength(2)
    const third = await p.advance('MCDTE-49')
    expect(third.status).toBe('resolved')
    expect(third.comments).toHaveLength(2)
  })

  it('throws for an unknown ticket and reset restores the demo data', async () => {
    const p = createFixtureProvider()
    await expect(p.advance('NOPE-1')).rejects.toThrow()
    await p.advance('MCDTE-49')
    p.reset()
    expect((await p.get('MCDTE-49')).status).toBe('new')
  })
})
