import { describe, expect, it } from 'vitest'
import { TICKET_KEY_RE, validateCommentBody, validateNewTicket } from '../../server/utils/validation'

const LOCATIONS = ['CZ_PHA_NUSLE', 'CZ_BRN_CENTRUM']

describe('TICKET_KEY_RE', () => {
  it('accepts real-looking keys', () => {
    expect(TICKET_KEY_RE.test('MCDTE-48')).toBe(true)
    expect(TICKET_KEY_RE.test('MCDTE-50-a1')).toBe(true)
  })

  it('rejects keys without the required shape', () => {
    expect(TICKET_KEY_RE.test('mcdte-48')).toBe(false)
    expect(TICKET_KEY_RE.test('48')).toBe(false)
    expect(TICKET_KEY_RE.test('')).toBe(false)
  })
})

describe('validateNewTicket', () => {
  it('accepts a valid ticket and trims the summary', () => {
    const result = validateNewTicket(
      { summary: '  My laptop keeps shutting down  ', location: 'CZ_PHA_NUSLE' },
      LOCATIONS
    )
    expect(result).toEqual({
      ok: true,
      value: { summary: 'My laptop keeps shutting down', description: undefined, location: 'CZ_PHA_NUSLE', ticketType: undefined }
    })
  })

  it('rejects a missing or empty summary', () => {
    expect(validateNewTicket({ location: 'CZ_PHA_NUSLE' }, LOCATIONS).ok).toBe(false)
    expect(validateNewTicket({ summary: '   ', location: 'CZ_PHA_NUSLE' }, LOCATIONS).ok).toBe(false)
  })

  it('rejects a summary over 255 characters', () => {
    const result = validateNewTicket({ summary: 'x'.repeat(256), location: 'CZ_PHA_NUSLE' }, LOCATIONS)
    expect(result.ok).toBe(false)
  })

  it('rejects a description over 4000 characters', () => {
    const result = validateNewTicket(
      { summary: 'ok', description: 'x'.repeat(4001), location: 'CZ_PHA_NUSLE' },
      LOCATIONS
    )
    expect(result.ok).toBe(false)
  })

  it('rejects a location that is not a create-meta option', () => {
    const result = validateNewTicket({ summary: 'ok', location: 'MARS_BASE' }, LOCATIONS)
    expect(result.ok).toBe(false)
  })

  it('rejects an unknown ticketType', () => {
    const result = validateNewTicket({ summary: 'ok', location: 'CZ_PHA_NUSLE', ticketType: 'sabotage' }, LOCATIONS)
    expect(result.ok).toBe(false)
  })

  it('rejects a non-object body', () => {
    expect(validateNewTicket(null, LOCATIONS).ok).toBe(false)
    expect(validateNewTicket('nope', LOCATIONS).ok).toBe(false)
  })
})

describe('validateCommentBody', () => {
  it('accepts a normal comment', () => {
    expect(validateCommentBody({ body: 'Sending the serial number now.' })).toEqual({
      ok: true,
      value: 'Sending the serial number now.'
    })
  })

  it('rejects an empty or missing comment', () => {
    expect(validateCommentBody({ body: '' }).ok).toBe(false)
    expect(validateCommentBody({ body: '   ' }).ok).toBe(false)
    expect(validateCommentBody({}).ok).toBe(false)
  })

  it('rejects a comment over 2000 characters', () => {
    expect(validateCommentBody({ body: 'x'.repeat(2001) }).ok).toBe(false)
  })
})
