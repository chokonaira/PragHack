import type { TicketProvider } from '../../shared/types'
import { demoProvider } from './demoProvider'
import { createMockApiProvider } from './providers/mock'
import { useUpstream } from './upstream'

// See server/utils/errors.ts for why this isn't imported from 'h3' directly.
type ServerEvent = Parameters<typeof getCookie>[0]

export interface ModeResult {
  mode: 'live' | 'demo'
  reason?: string
}

/** docs/contracts.md: demo when NUXT_DEMO_MODE is set, the demo=1 cookie is set, or the health probe fails. */
export async function resolveMode(event: ServerEvent): Promise<ModeResult> {
  const config = useRuntimeConfig()
  if (config.demoMode) return { mode: 'demo', reason: 'NUXT_DEMO_MODE is set' }
  if (getCookie(event, 'demo') === '1') return { mode: 'demo', reason: 'demo cookie set' }

  const healthy = await useUpstream().health()
  if (!healthy) return { mode: 'demo', reason: 'health probe failed' }
  return { mode: 'live' }
}

let liveProvider: TicketProvider | undefined

export async function resolveProvider(event: ServerEvent): Promise<{ provider: TicketProvider, mode: ModeResult }> {
  const mode = await resolveMode(event)
  if (mode.mode === 'demo') return { provider: demoProvider, mode }
  liveProvider ??= createMockApiProvider(useUpstream())
  return { provider: liveProvider, mode }
}
