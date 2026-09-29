import type { ApiErrorBody } from '../../shared/types'
import type { ApiHealth } from '../types/api'

/** Default timeout for calls to the mock API. SPEC.md: 8 seconds, then fall back to demo mode. */
export const UPSTREAM_TIMEOUT_MS = 8_000
/** The health probe decides live or demo mode at startup, so it stays short. */
export const HEALTH_TIMEOUT_MS = 2_000

/**
 * Error thrown by every upstream call. `status` is the HTTP status our own
 * routes should answer with: 404 when the mock says not found, 504 on timeout,
 * 502 for everything else. Serialises to `{ message, status }` only, never a stack.
 */
export class ApiError extends Error {
  readonly status: number
  readonly path: string

  constructor(message: string, status: number, path: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.path = path
  }

  toBody(): ApiErrorBody {
    return { message: this.message, status: this.status }
  }

  toJSON(): ApiErrorBody {
    return this.toBody()
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

export interface UpstreamOptions {
  baseUrl: string
  timeoutMs?: number
  /** Injected in tests. Defaults to the global fetch. */
  fetch?: typeof globalThis.fetch
  /** Receives one line per call: method, path and status only. Never bodies. */
  log?: (line: string) => void
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  timeoutMs?: number
}

export interface Upstream {
  /** Resolves to the parsed JSON body, or `null` on `204` or an empty body. */
  request<T>(path: string, options?: RequestOptions): Promise<T | null>
  get<T>(path: string, timeoutMs?: number): Promise<T | null>
  post<T>(path: string, body: unknown, timeoutMs?: number): Promise<T | null>
  /** `GET /health`. True when the mock answers 2xx with `status: "Healthy"`. Never throws. */
  health(timeoutMs?: number): Promise<boolean>
}

function joinUrl(baseUrl: string, path: string): string {
  if (!path.startsWith('/')) throw new ApiError('Upstream path must start with /', 500, path)
  return baseUrl.replace(/\/+$/, '') + path
}

export function createUpstream(options: UpstreamOptions): Upstream {
  const baseUrl = options.baseUrl
  const defaultTimeout = options.timeoutMs ?? UPSTREAM_TIMEOUT_MS
  const fetchImpl = options.fetch ?? globalThis.fetch
  const log = options.log ?? ((line: string) => console.info(`[upstream] ${line}`))

  async function request<T>(path: string, req: RequestOptions = {}): Promise<T | null> {
    const method = req.method ?? 'GET'
    const url = joinUrl(baseUrl, path)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? defaultTimeout)

    let response: Response
    try {
      response = await fetchImpl(url, {
        method,
        headers: req.body === undefined
          ? { accept: 'application/json' }
          : { 'accept': 'application/json', 'content-type': 'application/json' },
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        signal: controller.signal
      })
    } catch {
      const timedOut = controller.signal.aborted
      log(`${method} ${path} -> ${timedOut ? 'timeout' : 'network error'}`)
      throw timedOut
        ? new ApiError('The ticket service did not answer in time', 504, path)
        : new ApiError('The ticket service is unreachable', 502, path)
    } finally {
      clearTimeout(timer)
    }

    log(`${method} ${path} -> ${response.status}`)

    if (response.status === 204) return null
    if (!response.ok) {
      throw response.status === 404
        ? new ApiError('Not found', 404, path)
        : new ApiError(`The ticket service answered ${response.status}`, 502, path)
    }

    const text = await response.text()
    if (text.trim() === '') return null
    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError('The ticket service returned an unreadable answer', 502, path)
    }
  }

  return {
    request,
    get: (path, timeoutMs) => request(path, { method: 'GET', timeoutMs }),
    post: (path, body, timeoutMs) => request(path, { method: 'POST', body, timeoutMs }),
    async health(timeoutMs = HEALTH_TIMEOUT_MS) {
      try {
        const body = await request<ApiHealth>('/health', { timeoutMs })
        return body?.status?.toLowerCase() === 'healthy'
      } catch {
        return false
      }
    }
  }
}

let shared: Upstream | undefined

/** The app-wide client. Base URL comes from `runtimeConfig.apiBase` (`NUXT_API_BASE`). */
export function useUpstream(): Upstream {
  shared ??= createUpstream({ baseUrl: useRuntimeConfig().apiBase })
  return shared
}
