# Contracts

The shapes our code agrees on, so Data, AI and UI people build against the same thing. If you need to change one, edit this file in the same push and add a line to the sync log in `TICKETS.md`. Types live in `shared/types.ts` (ticket T-04). API shapes from the mock are in [api/README.md](api/README.md).

## Domain types

```ts
export type StatusId = 'new' | 'in_progress' | 'resolved'
export type TicketTypeCode = 'incident' | 'request'      // used when creating
export type Impact = 'low' | 'medium' | 'high'            // AI estimate, never from the API

export interface Ticket {
  key: string                 // "MCDTE-48"
  summary: string
  description: string
  status: StatusId
  statusName: string          // "In progress"
  ticketType: string          // display name from the API, e.g. "Incident"
  location: string            // location code, e.g. "CZ_PHA_NUSLE"
  createdAt: string           // ISO 8601
  updatedAt: string
  isLocal?: boolean           // true if created in our overlay, not by the live API
}

export interface TicketComment {
  id: string
  author: string
  body: string
  createdAt: string
  fromCustomer: boolean
}

export interface TicketDetail extends Ticket {
  reporter: string
  assignee: string
  comments: TicketComment[]   // from our overlay or demo data, the mock has none
}

export interface NewTicket {
  summary: string             // required, 1 to 255 characters
  description?: string        // up to 4000 characters
  location: string            // must be one of the create-meta options
  ticketType?: TicketTypeCode
}

export interface CreateMeta {
  projectKey: string
  requestTypeId: string
  locations: Array<{ value: string; label: string }>
}
```

## TicketProvider

```ts
export interface TicketProvider {
  list(): Promise<Ticket[]>
  get(key: string): Promise<TicketDetail>
  create(input: NewTicket): Promise<Ticket>
  addComment(key: string, body: string): Promise<TicketComment>
  meta(): Promise<CreateMeta>
}
```

Two implementations: `MockApiProvider` (live mock plus overlay) and `FixtureProvider` (demo data). There is no `setStatus`: customers do not change status.

## Ticket routes (Data owner)

All errors use one shape: `{ "message": string, "status": number }`.

| Route | Body | Success | Errors |
|---|---|---|---|
| `GET /api/mode` | | `200 { mode: 'live' \| 'demo', reason?: string }` | |
| `GET /api/tickets` | | `200 Ticket[]` | `502` upstream failed |
| `GET /api/tickets/:key` | | `200 TicketDetail` | `400` bad key, `404`, `502` |
| `GET /api/create-meta` | | `200 CreateMeta` | `502` |
| `POST /api/tickets` | `NewTicket` | `201 Ticket` | `400` validation, `502` |
| `POST /api/tickets/:key/comments` | `{ body: string }` (1 to 2000 chars) | `201 TicketComment` | `400`, `404`, `502` |
| `POST /api/demo/reset` | | `204` | |

A valid key matches `^[A-Z][A-Z0-9]+-[A-Za-z0-9-]+$`.

## AI routes (AI owner)

Every AI response carries `source`: `'ai'` for a real model answer, `'demo'` for a pre-generated answer (demo mode, or the model is unreachable). The UI shows the "Demo data" badge when `source === 'demo'`.

### `POST /api/ai/structure-ticket`

Request: `{ "text": string }`, 1 to 4000 characters.

```ts
export interface StructuredTicket {
  summary: string                       // 80 characters or fewer
  description: string
  ticketType: TicketTypeCode | null     // null if unclear
  location: string | null               // must be a create-meta option, else null
  impact: Impact
  missingInfo: string[]                 // 0 to 3 short questions
  source: 'ai' | 'demo'
}
```

Errors: `400` empty or too long. `502` model unreachable or output invalid twice (the UI then shows the manual form).

### `POST /api/ai/summarize-ticket`

Request: `{ "key": string }`. The server loads the ticket and comments itself.

```ts
export interface AiSummary {
  whatsHappening: string                // 3 sentences or fewer
  waitingOn: 'you' | 'support' | 'nobody'
  actionRequired: string | null         // null when nothing is needed from the customer
  basedOnComments: number
  generatedAt: string
  source: 'ai' | 'demo'
}
```

Errors: `400` bad key, `404`, `502`. With zero comments the summary must say the history is short instead of guessing.

### P1: `POST /api/ai/draft-reply`

Request `{ "key": string }`, response `{ "draft": string, "source": 'ai' | 'demo' }`.

## LLM configuration (`server/utils/llm.ts`)

We use an Anthropic key, so the default provider is Anthropic's native Messages API. The utility also supports any OpenAI-compatible endpoint, so switching provider is an env change:

```
NUXT_LLM_PROVIDER   anthropic (default) or openai
NUXT_LLM_BASE_URL   anthropic: https://api.anthropic.com   openai-style: e.g. https://api.openai.com/v1
NUXT_LLM_API_KEY    server only, never committed
NUXT_LLM_MODEL      e.g. claude-sonnet-5-5 (or claude-haiku-4-5-20251001 if latency matters)
```

- `anthropic`: `POST {base}/v1/messages` with headers `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`. Body `{ model, max_tokens, system, messages: [{ role: 'user', content }] }`. The answer is the first block in `content` with `type: 'text'` (a `thinking` block may come first). `stop_reason: 'refusal'` counts as invalid output.
- `openai`: `POST {base}/chat/completions` with `Authorization: Bearer <key>`. The answer is in `choices[0].message.content`.

`askJson(system, user, validate)` calls the chosen provider, parses the reply as a JSON object (bare or in a Markdown fence) and runs `validate`, which returns the typed value or `null`. It retries once on timeout, network error, 429, 5xx or invalid output, then throws a typed `AiError` (`code`: `config`, `timeout`, `network`, `http`, `invalid_output`; `status` 504 on timeout, else 502). Timeout 10 seconds per attempt. Other 4xx answers (bad key, bad request) are not retried.

Ticket text goes in as `asData('name', text)`, which wraps it in `<data>` delimiters and neutralises closing tags inside it. Every system prompt that receives customer text appends `UNTRUSTED_DATA_RULE`. Logs carry provider, model, HTTP status and duration only.

## Demo mode

`GET /api/mode` reports `demo` when `NUXT_DEMO_MODE=true`, when the `demo=1` cookie is set, or when the health probe fails. In demo mode ticket routes use `FixtureProvider` and AI routes return pre-generated answers from `server/data/demo-ai.ts` with `source: 'demo'`.
