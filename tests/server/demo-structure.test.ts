import { describe, expect, it } from 'vitest'
import { structureDemo } from '../../server/data/demo-ai'

describe('structureDemo', () => {
  it('treats a breakage as a high impact incident', () => {
    const r = structureDemo('My laptop keeps shutting down since yesterday\'s update. It happened three times this morning.')
    expect(r.ticketType).toBe('incident')
    expect(r.impact).toBe('high')
    expect(r.summary).toBe('My laptop keeps shutting down since yesterday\'s update')
    expect(r.source).toBe('demo')
  })

  it('treats an order as a low impact request', () => {
    const r = structureDemo('Could you order a second monitor for my desk?')
    expect(r.ticketType).toBe('request')
    expect(r.impact).toBe('low')
  })

  it('only picks a location it recognises, otherwise asks', () => {
    expect(structureDemo('POS at Prague Nusle is offline').location).toBe('CZ_PHA_NUSLE')
    const r = structureDemo('The printer is offline')
    expect(r.location).toBeNull()
    expect(r.missingInfo).toContain('Which location are you at?')
  })

  it('keeps the summary within 80 characters', () => {
    const r = structureDemo(`${'word '.repeat(40)}is broken.`)
    expect(r.summary.length).toBeLessThanOrEqual(80)
  })
})
