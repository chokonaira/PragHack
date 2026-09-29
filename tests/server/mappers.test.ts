import { describe, expect, it } from 'vitest'
import {
  statusIdFromName,
  toCreateMeta,
  toCreateTicketRequest,
  toTicket,
  toTicketDetail
} from '../../server/utils/mappers'
import type { ApiCreateMeta, ApiTicketDetail, ApiTicketListItem } from '../../server/types/api'

const listItem: ApiTicketListItem = {
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

const detail: ApiTicketDetail = {
  ...listItem,
  summary: 'Mock ticket MCDTE-48',
  description: 'Mock description',
  status: 'New',
  reporter: 'Alex Novak',
  assignee: 'IT Support',
  attachments: []
}

describe('statusIdFromName', () => {
  it('matches the three mock statuses by name, case-insensitively', () => {
    expect(statusIdFromName('New')).toBe('new')
    expect(statusIdFromName('in progress')).toBe('in_progress')
    expect(statusIdFromName('IN PROGRESS')).toBe('in_progress')
    expect(statusIdFromName('Resolved')).toBe('resolved')
  })

  it('accepts ids and odd spacing too', () => {
    expect(statusIdFromName('in_progress')).toBe('in_progress')
    expect(statusIdFromName('  In-Progress ')).toBe('in_progress')
    expect(statusIdFromName('RESOLVED')).toBe('resolved')
  })

  it('falls back to new for unknown or missing names', () => {
    expect(statusIdFromName('Waiting for vendor')).toBe('new')
    expect(statusIdFromName('')).toBe('new')
    expect(statusIdFromName(undefined)).toBe('new')
  })
})

describe('toTicket', () => {
  it('maps a list item to our Ticket shape', () => {
    expect(toTicket(listItem)).toEqual({
      key: 'MCDTE-48',
      summary: 'Point of sale terminal is offline',
      description: 'Terminal 2 shows a black screen since this morning.',
      status: 'in_progress',
      statusName: 'In progress',
      ticketType: 'Incident',
      location: 'CZ_PHA_NUSLE',
      createdAt: '2026-09-28T08:00:00Z',
      updatedAt: '2026-09-29T09:30:00Z'
    })
  })

  it('applies overlay overrides last', () => {
    const t = toTicket(listItem, { key: 'MCDTE-50-a1b2', isLocal: true, statusName: 'Resolved', status: 'resolved' })
    expect(t.key).toBe('MCDTE-50-a1b2')
    expect(t.isLocal).toBe(true)
    expect(t.status).toBe('resolved')
  })
})

describe('toTicketDetail', () => {
  it('prefers list text and status over the placeholder detail, keeps people from the detail', () => {
    const comments = [{ id: 'c1', author: 'IT Support', body: 'Looking into it', createdAt: '2026-09-29T09:30:00Z', fromCustomer: false }]
    const result = toTicketDetail(detail, listItem, comments)
    expect(result.summary).toBe('Point of sale terminal is offline')
    expect(result.description).toBe('Terminal 2 shows a black screen since this morning.')
    expect(result.status).toBe('in_progress')
    expect(result.statusName).toBe('In progress')
    expect(result.reporter).toBe('Alex Novak')
    expect(result.assignee).toBe('IT Support')
    expect(result.comments).toEqual(comments)
    expect(result.comments).not.toBe(comments)
  })

  it('uses the detail when no list item exists and defaults to no comments', () => {
    const result = toTicketDetail(detail, undefined)
    expect(result.summary).toBe('Mock ticket MCDTE-48')
    expect(result.status).toBe('new')
    expect(result.comments).toEqual([])
  })
})

describe('toCreateMeta', () => {
  const meta: ApiCreateMeta = {
    projectKey: 'MCDTE',
    requestTypeId: '101',
    fields: [
      { key: 'summary', label: 'Summary', type: 'text', required: true },
      {
        key: 'location',
        label: 'Location',
        type: 'select',
        required: true,
        options: [{ value: 'CZ_PHA_NUSLE', label: 'Praha Nusle' }, { value: 'CZ_BRQ_CENTRUM', label: 'Brno centrum' }]
      }
    ]
  }

  it('lifts the location options', () => {
    expect(toCreateMeta(meta)).toEqual({
      projectKey: 'MCDTE',
      requestTypeId: '101',
      locations: [{ value: 'CZ_PHA_NUSLE', label: 'Praha Nusle' }, { value: 'CZ_BRQ_CENTRUM', label: 'Brno centrum' }]
    })
  })

  it('returns an empty list when there is no location field', () => {
    expect(toCreateMeta({ ...meta, fields: meta.fields.filter(f => f.key !== 'location') }).locations).toEqual([])
  })

  it('builds the create request body from NewTicket and meta', () => {
    const our = toCreateMeta(meta)
    expect(toCreateTicketRequest({ summary: 'Laptop broken', location: 'CZ_PHA_NUSLE' }, our)).toEqual({
      projectKey: 'MCDTE',
      requestTypeId: '101',
      summary: 'Laptop broken',
      location: 'CZ_PHA_NUSLE'
    })
    expect(toCreateTicketRequest(
      { summary: 'Laptop broken', description: 'Screen cracked', location: 'CZ_PHA_NUSLE', ticketType: 'incident' },
      our
    )).toMatchObject({ description: 'Screen cracked', ticketType: 'incident' })
  })
})
