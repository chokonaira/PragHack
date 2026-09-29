import type { TicketDetail } from '../../shared/types'
import { parseRedisUrl, runCommands, type RedisTarget, type RespValue } from './redisTcp'

/** Everything the demo provider needs to keep between requests. */
export interface DemoState {
  tickets: TicketDetail[]
  nextKey: number
  nextComment: number
}

/** Where demo state lives. Without one, state stays in this server instance's memory. */
export interface DemoStore {
  load(): Promise<DemoState | null>
  save(state: DemoState): Promise<void>
}

const STATE_KEY = 'ticketflow:demo:v1'
const TTL_SECONDS = 60 * 60 * 24
const TIMEOUT_MS = 3000

type Command = Array<string | number>

/**
 * Vercel serverless runs many separate instances, so in-memory demo state is not shared between requests.
 * Keeping it in Redis makes created tickets, comments and support updates visible to every request and device.
 * A failing store never breaks a request: load answers null and save is skipped, so the instance falls back to memory.
 */
function storeFromCommand(command: (args: Command) => Promise<unknown>): DemoStore {
  return {
    async load() {
      try {
        const raw = await command(['GET', STATE_KEY])
        if (typeof raw !== 'string') return null
        const parsed = JSON.parse(raw) as Partial<DemoState>
        if (!Array.isArray(parsed.tickets) || typeof parsed.nextKey !== 'number' || typeof parsed.nextComment !== 'number') return null
        return parsed as DemoState
      } catch {
        console.warn('[demo-store] load failed, using instance memory')
        return null
      }
    },
    async save(state) {
      try {
        await command(['SET', STATE_KEY, JSON.stringify(state), 'EX', TTL_SECONDS])
      } catch {
        console.warn('[demo-store] save failed, state stays in instance memory')
      }
    }
  }
}

type FetchLike = (input: string, init: { method: string, headers: Record<string, string>, body: string, signal: AbortSignal }) => Promise<{ ok: boolean, json(): Promise<unknown> }>

/** Upstash Redis over its REST API, using plain fetch. */
export function createUpstashStore(url: string, token: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): DemoStore {
  return storeFromCommand(async (args) => {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })
    if (!res.ok) throw new Error('store request failed')
    const body = await res.json() as { result?: unknown }
    return body.result ?? null
  })
}

type RunCommands = (target: RedisTarget, commands: Command[], timeoutMs?: number) => Promise<RespValue[]>

/** Any Redis reachable over TCP (Railway, Redis Cloud, and so on), from a redis:// or rediss:// URL. */
export function createRedisStore(redisUrl: string, run: RunCommands = runCommands): DemoStore | undefined {
  const target = parseRedisUrl(redisUrl)
  if (!target) return undefined
  return storeFromCommand(async (args) => {
    const [reply] = await run(target, [args], TIMEOUT_MS)
    return reply ?? null
  })
}

function runtimeEnv(): Record<string, string | undefined> {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
}

/** REDIS_URL (any Redis over TCP) first, then Upstash's REST variables, otherwise nothing. */
export function demoStoreFromEnv(env: Record<string, string | undefined> = runtimeEnv()): DemoStore | undefined {
  if (env.REDIS_URL) {
    const store = createRedisStore(env.REDIS_URL)
    if (store) return store
    console.warn('[demo-store] REDIS_URL is not a valid redis:// URL, ignoring it')
  }
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? createUpstashStore(url, token) : undefined
}
