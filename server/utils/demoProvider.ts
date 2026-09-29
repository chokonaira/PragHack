import { demoStoreFromEnv } from './demoStore'
import { createFixtureProvider } from './providers/fixture'

// Shared demo provider. With Vercel's Upstash variables present, its state lives in Redis so
// every serverless instance sees the same tickets. Without them it stays in this instance's memory.
export const demoProvider = createFixtureProvider(demoStoreFromEnv())
