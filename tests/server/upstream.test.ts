import { describe, expect, it, vi } from 'vitest'
import { ApiError, createUpstream, isApiError } from '../../server/utils/upstream'

type FetchImpl = typeof globalThis.fetch

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function upstreamWith(fetch: FetchImpl, timeoutMs = 50) {
  const lines: string[] = []
  const client = createUpstream({ baseUrl: 'http://mock.test/', timeoutMs, fetch, log: l => lines.push(l) })
  return { client, lines }
}

async function expectApiError(promise: Promise<unknown>, status: number): Promise<ApiError> {
  try {
    await promise
  } catch (err) {
    expect(isApiError(err)).toBe(true)
    expect((err as ApiError).status).toBe(status)
    return err as ApiError
  }
  throw new Error('expected an ApiError')
}

describe('createUpstream', () => {
  it('builds the URL from the base and parses JSON', async () => {
    const fetch = vi.fn<FetchImpl>(async () => jsonResponse([{ issueKey: 'MCDTE-48' }]))
    const { client, lines } = upstreamWith(fetch)

    const body = await client.get<Array<{ issueKey: string }>>('/api/v1/tickets')

    expect(body).toEqual([{ issueKey: 'MCDTE-48' }])
    expect(fetch.mock.calls[0]?.[0]).toBe('http://mock.test/api/v1/tickets')
    expect(lines).toEqual(['GET /api/v1/tickets -> 200'])
  })

  it('sends JSON bodies on POST and logs no body text', async () => {
    const fetch = vi.fn<FetchImpl>(async () => jsonResponse({ issueKey: 'MCDTE-50' }, 201))
    const { client, lines } = upstreamWith(fetch)

    await client.post('/api/v1/tickets', { summary: 'SECRET ticket text' })

    const init = fetch.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ summary: 'SECRET ticket text' }))
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json')
    expect(lines.join('\n')).not.toContain('SECRET')
  })

  it('returns null on 204', async () => {
    const { client } = upstreamWith(async () => new Response(null, { status: 204 }))
    expect(await client.post('/api/v1/auth/logout', {})).toBeNull()
  })

  it('returns null on an empty 200 body', async () => {
    const { client } = upstreamWith(async () => new Response('', { status: 200 }))
    expect(await client.get('/api/v1/tickets')).toBeNull()
  })

  it('throws a 404 ApiError when the mock has no route', async () => {
    const { client } = upstreamWith(async () => jsonResponse({ error: 'No matching route for /nope' }, 404))
    const err = await expectApiError(client.get('/nope'), 404)
    expect(err.path).toBe('/nope')
  })

  it('maps other non-2xx answers to 502', async () => {
    const { client } = upstreamWith(async () => new Response('boom', { status: 500 }))
    await expectApiError(client.get('/api/v1/tickets'), 502)
  })

  it('throws 504 when the call exceeds the timeout', async () => {
    const hanging: FetchImpl = (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })
    const { client, lines } = upstreamWith(hanging, 20)

    await expectApiError(client.get('/api/v1/tickets'), 504)
    expect(lines).toEqual(['GET /api/v1/tickets -> timeout'])
  })

  it('throws 502 on a network failure', async () => {
    const { client } = upstreamWith(async () => {
      throw new TypeError('fetch failed')
    })
    await expectApiError(client.get('/api/v1/tickets'), 502)
  })

  it('throws 502 on invalid JSON', async () => {
    const { client } = upstreamWith(async () => new Response('<html>', { status: 200 }))
    await expectApiError(client.get('/api/v1/tickets'), 502)
  })

  it('serialises without a stack trace', () => {
    const err = new ApiError('Not found', 404, '/x')
    expect(JSON.parse(JSON.stringify(err))).toEqual({ message: 'Not found', status: 404 })
    expect(err.toBody()).toEqual({ message: 'Not found', status: 404 })
    expect(err.stack).toBeDefined()
  })

  it('rejects paths that do not start with a slash', async () => {
    const { client } = upstreamWith(async () => jsonResponse({}))
    await expectApiError(client.get('api/v1/tickets'), 500)
  })
})

describe('health', () => {
  it('is true when /health answers Healthy', async () => {
    const fetch = vi.fn<FetchImpl>(async () => jsonResponse({ status: 'Healthy', version: '1.1.0-mock' }))
    const { client } = upstreamWith(fetch)
    expect(await client.health()).toBe(true)
    expect(fetch.mock.calls[0]?.[0]).toBe('http://mock.test/health')
  })

  it('is false on any error, without throwing', async () => {
    const down = upstreamWith(async () => {
      throw new TypeError('fetch failed')
    })
    expect(await down.client.health()).toBe(false)

    const sick = upstreamWith(async () => jsonResponse({ status: 'Degraded' }))
    expect(await sick.client.health()).toBe(false)

    const slow = upstreamWith((_url, init) => new Promise((_r, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    expect(await slow.client.health(10)).toBe(false)
  })
})
