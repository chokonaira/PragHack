import { describe, expect, it, vi } from 'vitest'
import type { TicketDetail } from '../../shared/types'
import { buildDemoTickets } from '../../server/data/demo'
import {
  shortHistorySummary,
  summarizeTicket,
  summaryUserPrompt,
  validateSummaryFields
} from '../../server/utils/ai/summarize'
import { createLlm, type LlmConfig } from '../../server/utils/llm'

type FetchImpl = typeof globalThis.fetch

function anthropicReply(text: string): Response {
  return new Response(JSON.stringify({
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }]
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}

const config: LlmConfig = {
  provider: 'anthropic',
  baseUrl: 'https://llm.test/',
  apiKey: 'sk-test',
  model: 'test-model'
}

function ticketByKey(key: string): TicketDetail {
  const found = buildDemoTickets().find(t => t.key === key)
  if (!found) throw new Error(`no demo ticket ${key}`)
  return found
}

describe('validateSummaryFields', () => {
  it('accepts a well-shaped answer and trims strings', () => {
    const result = validateSummaryFields({
      whatsHappening: '  Your laptop was replaced.  ',
      waitingOn: 'nobody',
      actionRequired: null
    })
    expect(result).toEqual({ whatsHappening: 'Your laptop was replaced.', waitingOn: 'nobody', actionRequired: null })
  })

  it('rejects an unknown waitingOn value', () => {
    expect(validateSummaryFields({ whatsHappening: 'x', waitingOn: 'maybe', actionRequired: null })).toBeNull()
  })

  it('rejects a missing or empty whatsHappening', () => {
    expect(validateSummaryFields({ whatsHappening: '', waitingOn: 'support', actionRequired: null })).toBeNull()
    expect(validateSummaryFields({ waitingOn: 'support', actionRequired: null })).toBeNull()
  })

  it('rejects an actionRequired that is neither a string nor null', () => {
    expect(validateSummaryFields({ whatsHappening: 'x', waitingOn: 'you', actionRequired: 42 })).toBeNull()
  })
})

describe('shortHistorySummary', () => {
  it('says the history is short and invents nothing', () => {
    const summary = shortHistorySummary(0)
    expect(summary.basedOnComments).toBe(0)
    expect(summary.waitingOn).toBe('support')
    expect(summary.actionRequired).toBeNull()
    expect(summary.source).toBe('ai')
    expect(summary.whatsHappening).toMatch(/no updates yet/)
  })
})

describe('summaryUserPrompt', () => {
  it('includes the ticket key and every comment body', () => {
    const ticket = ticketByKey('MCDTE-42')
    const prompt = summaryUserPrompt(ticket)
    expect(prompt).toContain('MCDTE-42')
    for (const comment of ticket.comments) {
      expect(prompt).toContain(comment.body)
    }
  })
})

describe('summarizeTicket', () => {
  it('sample D: a zero-comment ticket says the history is short without calling the model', async () => {
    const ticket = ticketByKey('MCDTE-49')
    expect(ticket.comments).toHaveLength(0)
    const askJson = vi.fn()
    const summary = await summarizeTicket(ticket, { askJson })

    expect(askJson).not.toHaveBeenCalled()
    expect(summary.basedOnComments).toBe(0)
    expect(summary.whatsHappening).toMatch(/no updates yet/)
  })

  it('sample A: the long-thread demo ticket is waiting on support and reports the real comment count', async () => {
    const ticket = ticketByKey('MCDTE-42')
    expect(ticket.comments.length).toBeGreaterThanOrEqual(8)
    const fetch = vi.fn<FetchImpl>(async () => anthropicReply(JSON.stringify({
      whatsHappening: 'Your laptop kept shutting down because of a failing battery controller. A replacement was approved and ordered.',
      waitingOn: 'support',
      actionRequired: null
    })))
    const llm = createLlm({ config, fetch, timeoutMs: 50 })

    const summary = await summarizeTicket(ticket, llm)

    expect(summary.waitingOn).toBe('support')
    expect(summary.basedOnComments).toBe(ticket.comments.length)
    expect(summary.source).toBe('ai')
    expect(summary.whatsHappening.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3)
  })

  it('sample B: a ticket waiting on the customer names the missing item', async () => {
    const ticket = ticketByKey('MCDTE-44')
    const fetch = vi.fn<FetchImpl>(async () => anthropicReply(JSON.stringify({
      whatsHappening: 'The access point in the back of the store is offline and a remote reset did not fix it.',
      waitingOn: 'you',
      actionRequired: 'Send the serial number printed on the access point.'
    })))
    const llm = createLlm({ config, fetch, timeoutMs: 50 })

    const summary = await summarizeTicket(ticket, llm)

    expect(summary.waitingOn).toBe('you')
    expect(summary.actionRequired).toMatch(/serial number/)
  })

  it('sample C: a resolved ticket needs nothing further', async () => {
    const ticket = ticketByKey('MCDTE-41')
    const fetch = vi.fn<FetchImpl>(async () => anthropicReply(JSON.stringify({
      whatsHappening: 'Password reset emails were blocked by your mailbox. Support whitelisted the sender and you confirmed it works.',
      waitingOn: 'nobody',
      actionRequired: null
    })))
    const llm = createLlm({ config, fetch, timeoutMs: 50 })

    const summary = await summarizeTicket(ticket, llm)

    expect(summary.waitingOn).toBe('nobody')
    expect(summary.actionRequired).toBeNull()
  })

  it('throws the AiError from askJson when the model never answers validly', async () => {
    const ticket = ticketByKey('MCDTE-42')
    const fetch = vi.fn<FetchImpl>(async () => anthropicReply('not json'))
    const llm = createLlm({ config, fetch, timeoutMs: 50 })

    await expect(summarizeTicket(ticket, llm)).rejects.toMatchObject({ name: 'AiError', code: 'invalid_output' })
  })
})
