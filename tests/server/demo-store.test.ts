import { describe, expect, it, vi } from 'vitest'
import { createUpstashStore, demoStoreFromEnv, type DemoState, type DemoStore } from '../../server/utils/demoStore'
import { createFixtureProvider } from '../../server/utils/providers/fixture'

function memoryStore(): DemoStore & { saves: number } {
  let saved: string | null = null
  const store = {
    saves: 0,
    async load() {
      return saved ? (JSON.parse(saved) as DemoState) : null
    },
    async save(state: DemoState) {
      store.saves++
      saved = JSON.stringify(state)
    }
  }
  return store
}

describe('shared demo state across serverless instances', () => {
  it('without a store, two instances do not see each other (the Vercel bug)', async () => {
    const a = createFixtureProvider()
    const b = createFixtureProvider()
    const ticket = await a.create({ summary: 'Only in A', location: 'CZ_PHA_NUSLE' })
    await expect(b.get(ticket.key)).rejects.toThrow()
  })

  it('with a shared store, a ticket created on one instance is readable on another', async () => {
    const store = memoryStore()
    const a = createFixtureProvider(store)
    const b = createFixtureProvider(store)
    const ticket = await a.create({ summary: 'Shared', location: 'CZ_PHA_NUSLE' })
    expect((await b.get(ticket.key)).summary).toBe('Shared')
    expect((await b.list()).some(t => t.key === ticket.key)).toBe(true)
  })

  it('shares support updates, comments and reset', async () => {
    const store = memoryStore()
    const a = createFixtureProvider(store)
    const b = createFixtureProvider(store)
    const ticket = await a.create({ summary: 'Flow', location: 'CZ_PHA_NUSLE' })
    await b.advance(ticket.key)
    expect((await a.get(ticket.key)).status).toBe('in_progress')
    await a.addComment(ticket.key, 'Thanks')
    expect((await b.get(ticket.key)).comments.at(-1)!.body).toBe('Thanks')
    await a.reset()
    await expect(b.get(ticket.key)).rejects.toThrow()
    expect((await b.list())).toHaveLength(8)
  })

  it('gives every instance the same keys, never a duplicate', async () => {
    const store = memoryStore()
    const a = createFixtureProvider(store)
    const b = createFixtureProvider(store)
    const first = await a.create({ summary: '1', location: 'CZ_PHA_NUSLE' })
    const second = await b.create({ summary: '2', location: 'CZ_PHA_NUSLE' })
    expect(first.key).not.toBe(second.key)
  })
})

describe('createUpstashStore', () => {
  const state: DemoState = { tickets: [], nextKey: 51, nextComment: 3 }

  it('loads the saved state with GET', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ result: JSON.stringify(state) }) }))
    const store = createUpstashStore('https://redis.example', 'secret-token', fetchImpl)
    expect(await store.load()).toEqual(state)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, { method: string, headers: Record<string, string>, body: string }]
    expect(url).toBe('https://redis.example')
    expect(init.headers.Authorization).toBe('Bearer secret-token')
    expect(JSON.parse(init.body)[0]).toBe('GET')
  })

  it('saves with SET and an expiry', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ result: 'OK' }) }))
    await createUpstashStore('https://redis.example', 't', fetchImpl).save(state)
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, { body: string }])[1].body)
    expect(body[0]).toBe('SET')
    expect(body).toContain('EX')
    expect(JSON.parse(body[2])).toEqual(state)
  })

  it('never breaks a request when the store fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const failing = vi.fn(async () => {
      throw new Error('down')
    })
    const store = createUpstashStore('https://redis.example', 't', failing)
    expect(await store.load()).toBeNull()
    await expect(store.save(state)).resolves.toBeUndefined()
  })

  it('treats an empty or malformed value as no state', async () => {
    const empty = vi.fn(async () => ({ ok: true, json: async () => ({ result: null }) }))
    const junk = vi.fn(async () => ({ ok: true, json: async () => ({ result: '{"tickets":"nope"}' }) }))
    expect(await createUpstashStore('u', 't', empty).load()).toBeNull()
    expect(await createUpstashStore('u', 't', junk).load()).toBeNull()
  })
})

describe('demoStoreFromEnv', () => {
  it('is off without Redis variables', () => {
    expect(demoStoreFromEnv({})).toBeUndefined()
    expect(demoStoreFromEnv({ KV_REST_API_URL: 'https://x' })).toBeUndefined()
  })

  it('turns on with either variable naming Vercel and Upstash use', () => {
    expect(demoStoreFromEnv({ KV_REST_API_URL: 'https://x', KV_REST_API_TOKEN: 't' })).toBeDefined()
    expect(demoStoreFromEnv({ UPSTASH_REDIS_REST_URL: 'https://x', UPSTASH_REDIS_REST_TOKEN: 't' })).toBeDefined()
  })
})
