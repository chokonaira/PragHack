/**
 * Decides whether an AI route calls the real model or answers from the pre-written demo answers.
 * Live mode always uses the model. Demo mode uses the model only when NUXT_AI_LIVE is on and a key is set,
 * so the demo tickets can show real AI without ever spending credit by accident.
 */
export function shouldUseRealAi(mode: 'live' | 'demo', aiLive: boolean, hasKey: boolean): boolean {
  if (mode === 'live') return true
  return aiLive && hasKey
}

/**
 * In demo mode a model failure falls back to the pre-written answer, so a demo never dies on the network
 * or a key problem. Live mode reports the error instead: it must not pass demo text off as real.
 */
export function fallsBackToDemo(mode: 'live' | 'demo'): boolean {
  return mode === 'demo'
}
