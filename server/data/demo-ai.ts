import type { AiSummary, StructuredTicket } from '../../shared/types'

// Hand-written AI answers for demo mode and as offline fallback.
// Every answer has source: 'demo' so the UI can label it as demo data.

type SummaryFields = Omit<AiSummary, 'generatedAt' | 'source'>

const SUMMARIES: Record<string, SummaryFields> = {
  'MCDTE-42': {
    whatsHappening: 'Your laptop kept shutting down because of a failing battery controller, not the update. A replacement was approved and a new laptop has been ordered.',
    waitingOn: 'support',
    actionRequired: null,
    basedOnComments: 9
  },
  'MCDTE-44': {
    whatsHappening: 'The access point in the back of the store is offline and a remote reset did not fix it. Support needs to arrange a replacement.',
    waitingOn: 'you',
    actionRequired: 'Send the serial number printed on the access point.',
    basedOnComments: 2
  },
  'MCDTE-41': {
    whatsHappening: 'Password reset emails were blocked by your mailbox. Support whitelisted the sender and you confirmed it works. This ticket is closed.',
    waitingOn: 'nobody',
    actionRequired: null,
    basedOnComments: 3
  },
  'MCDTE-49': {
    whatsHappening: 'This request was created recently and has no updates yet, so there is not much to summarize.',
    waitingOn: 'support',
    actionRequired: null,
    basedOnComments: 0
  },
  'MCDTE-48': {
    whatsHappening: 'The card terminal is offline and the payment provider is deploying a fix today. Cash payments are the workaround until then.',
    waitingOn: 'support',
    actionRequired: null,
    basedOnComments: 3
  },
  'MCDTE-45': {
    whatsHappening: 'Your monitor request was received and is waiting for manager approval.',
    waitingOn: 'support',
    actionRequired: null,
    basedOnComments: 1
  },
  'MCDTE-46': {
    whatsHappening: 'This incident was reported very recently and has no updates yet, so there is not much to summarize.',
    waitingOn: 'support',
    actionRequired: null,
    basedOnComments: 0
  },
  'MCDTE-43': {
    whatsHappening: 'The side entrance permission was missing from your badge. Support added it and you confirmed it works. This ticket is closed.',
    waitingOn: 'nobody',
    actionRequired: null,
    basedOnComments: 3
  }
}

export function getDemoSummary(key: string, commentCount: number): AiSummary {
  const known = SUMMARIES[key]
  const fields: SummaryFields = known ?? {
    whatsHappening: commentCount === 0
      ? 'This ticket has no updates yet, so there is not much to summarize.'
      : 'This ticket has a short history. Open the timeline below to read the updates.',
    waitingOn: 'support',
    actionRequired: null,
    basedOnComments: commentCount
  }
  return { ...fields, generatedAt: new Date().toISOString(), source: 'demo' }
}

export function getDemoStructuredTicket(): StructuredTicket {
  return {
    summary: 'Laptop randomly shutting down after update',
    description: 'The laptop started shutting down unexpectedly after yesterday\'s system update. It happened three times this morning and the user cannot work properly.',
    ticketType: 'incident',
    location: null,
    impact: 'high',
    missingInfo: ['What is the laptop model?', 'Which location are you at?'],
    source: 'demo'
  }
}

const REQUEST_WORDS = /\b(need|order|request|could you|access|new account|install|set up|second monitor)\b/i
const PROBLEM_WORDS = /\b(broken|not working|offline|crash|crashing|error|down|fail|failing|shut|shutting|blank|slow)\b/i
const HIGH_WORDS = /\b(cannot|can't|can not|unable|offline|outage|crash|crashing|shutting|not accepting|data loss|security)\b/i

// Rule-based stand-in for the real model. Always labelled source 'demo'.
export function structureDemo(text: string): StructuredTicket {
  const clean = text.trim().replace(/\s+/g, ' ')
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean
  const trimmed = firstSentence.replace(/[.!?]+$/, '')
  const short = trimmed.length > 80 ? `${trimmed.slice(0, 77).trimEnd()}...` : trimmed
  const summary = short.charAt(0).toUpperCase() + short.slice(1)

  const isRequest = REQUEST_WORDS.test(clean) && !PROBLEM_WORDS.test(clean)
  const impact = isRequest ? 'low' : HIGH_WORDS.test(clean) ? 'high' : 'medium'
  const location = /nusle|prague/i.test(clean) ? 'CZ_PHA_NUSLE' : /brno/i.test(clean) ? 'CZ_BRN_CENTRUM' : null

  const missingInfo: string[] = []
  if (!location) missingInfo.push('Which location are you at?')
  if (!isRequest && clean.length < 60) missingInfo.push('When did it start?')

  return {
    summary,
    description: clean,
    ticketType: isRequest ? 'request' : 'incident',
    location,
    impact,
    missingInfo,
    source: 'demo'
  }
}
