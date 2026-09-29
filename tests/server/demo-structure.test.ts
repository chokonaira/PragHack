import { describe, expect, it } from 'vitest'
import { getDemoSummary, structureDemo } from '../../server/data/demo-ai'

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

describe('getDemoSummary', () => {
  it('keeps the written answer while the ticket is unchanged', () => {
    const s = getDemoSummary('MCDTE-42', 9, 'in_progress')
    expect(s.basedOnComments).toBe(9)
    expect(s.whatsHappening).toContain('battery controller')
  })

  it('reflects a status change made after the answer was written', () => {
    const s = getDemoSummary('MCDTE-49', 1, 'in_progress')
    expect(s.whatsHappening).toContain('picked this up')
    expect(s.waitingOn).toBe('support')
    expect(getDemoSummary('MCDTE-49', 2, 'resolved').waitingOn).toBe('nobody')
  })

  it('labels every answer as demo data', () => {
    expect(getDemoSummary('X-1', 0).source).toBe('demo')
  })
})
