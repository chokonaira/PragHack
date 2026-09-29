import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../server/utils/errors'
import { createMockApiProvider } from '../../server/utils/providers/mock'
import { createUpstream } from '../../server/utils/upstream'

type FetchImpl = typeof globalThis.fetch

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** Routes each call to a handler keyed by "METHOD /path", so each test only wires what it needs. */
function fetchFor(handlers: Record<string, () => Response>): FetchImpl {
  return (async (url: string | URL, init?: RequestInit) => {
    const path = url.toString().replace('http://mock.test', '')
    const key = `${init?.method ?? 'GET'} ${path}`
    const handler = handlers[key]
    if (!handler) throw new Error(`unhandled request in test: ${key}`)
    return handler()
  }) as FetchImpl
}

function providerWith(handlers: Record<string, () => Response>) {
  const upstream = createUpstream({ baseUrl: 'http://mock.test/', fetch: fetchFor(handlers) })
  return createMockApiProvider(upstream)
}

const listItem = {
  issueKey: 'MCDTE-48',
  summary: 'Point of sale terminal is offline',
  description: 'Terminal 2 shows a black screen since this morning.',
  status: 'In progress',
  ticketType: 'Incident',
  projectKey: 'MCDTE',
  location: 'CZ_PHA_NUSLE',
  createdAt: '2026-09-28T08:00:00Z',
  updatedAt: '2026-09-29T09:30:00Z'
}

const detail = {
  ...listItem,
  summary: 'Mock ticket MCDTE-48',
  description: 'Mock description',
  status: 'New',
  reporter: 'Alex Novak',
  assignee: 'IT Support',
  attachments: [] as unknown[]
}

const createMeta = {
  projectKey: 'MCDTE',
  requestTypeId: '101',
  fields: [
    { key: 'summary', label: 'Summary', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'select', required: true, options: [{ value: 'CZ_PHA_NUSLE', label: 'Prague - Nusle' }] }
  ]
}

describe('createMockApiProvider: overlay', () => {
  it('merges a locally created ticket with the remote list, most recent first', async () => {
    const provider = providerWith({
      'GET /api/v1/tickets/create-meta': () => jsonResponse(createMeta),
      'POST /api/v1/tickets': () => jsonResponse({ issueKey: 'MCDTE-50', id: '50', summary: 'x', status: 'New' }, 201),
      'GET /api/v1/tickets': () => jsonResponse([listItem])
    })

    const created = await provider.create({ summary: 'New issue', location: 'CZ_PHA_NUSLE' })
    const list = await provider.list()

    expect(list.map(t => t.key)).toEqual([created.key, 'MCDTE-48'])
    expect(list.find(t => t.key === created.key)?.isLocal).toBe(true)
  })

  it('overlays a comment on a remote ticket and returns it from a later get()', async () => {
    const provider = providerWith({
      'POST /api/v1/tickets/MCDTE-48/updates': () => jsonResponse({ issueKey: 'MCDTE-48', updatedAt: '2026-09-29T10:00:00Z', status: 'In progress' }),
      'GET /api/v1/tickets/MCDTE-48': () => jsonResponse(detail),
      'GET /api/v1/tickets': () => jsonResponse([listItem])
    })

    const comment = await provider.addComment('MCDTE-48', 'Sending the serial number now.')
    const result = await provider.get('MCDTE-48')

    expect(comment.body).toBe('Sending the serial number now.')
    expect(result.comments).toEqual([comment])
  })
})

describe('createMockApiProvider: unique keys', () => {
  it('suffixes the key when the mock answers the same fixed key twice', async () => {
    const provider = providerWith({
      'GET /api/v1/tickets/create-meta': () => jsonResponse(createMeta),
      'POST /api/v1/tickets': () => jsonResponse({ issueKey: 'MCDTE-50', id: '50', summary: 'x', status: 'New' }, 201)
    })

    const first = await provider.create({ summary: 'First', location: 'CZ_PHA_NUSLE' })
    const second = await provider.create({ summary: 'Second', location: 'CZ_PHA_NUSLE' })

    expect(first.key).toBe('MCDTE-50')
    expect(second.key).not.toBe('MCDTE-50')
    expect(second.key.startsWith('MCDTE-50-')).toBe(true)
  })
})

describe('createMockApiProvider: get()', () => {
  it('takes summary and description from the list item, not the placeholder detail', async () => {
    const provider = providerWith({
      'GET /api/v1/tickets/MCDTE-48': () => jsonResponse(detail),
      'GET /api/v1/tickets': () => jsonResponse([listItem])
    })

    const result = await provider.get('MCDTE-48')

    expect(result.summary).toBe(listItem.summary)
    expect(result.description).toBe(listItem.description)
    expect(result.reporter).toBe('Alex Novak')
  })

  it('throws NotFoundError when the upstream detail call comes back empty', async () => {
    const provider = providerWith({
      'GET /api/v1/tickets/MCDTE-999': () => new Response(null, { status: 204 }),
      'GET /api/v1/tickets': () => jsonResponse([listItem])
    })

    await expect(provider.get('MCDTE-999')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('createMockApiProvider: meta()', () => {
  it('maps create-meta location options', async () => {
    const provider = providerWith({ 'GET /api/v1/tickets/create-meta': () => jsonResponse(createMeta) })

    expect(await provider.meta()).toEqual({
      projectKey: 'MCDTE',
      requestTypeId: '101',
      locations: [{ value: 'CZ_PHA_NUSLE', label: 'Prague - Nusle' }]
    })
  })
})
