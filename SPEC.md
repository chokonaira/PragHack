# Spec: Autopilot Ticket Desk (MVP)

**Status:** draft for team review. Nothing is built yet. Under the hackathon rules, coding starts at kickoff.

## Assumptions (correct these first)

1. We pick the topic **AI-Powered Ticket Management Experience** and register for it.
2. The main user is a **service desk operator**. Customers are out of scope.
3. The Mock Ticketing API offers at least: list tickets, get one, create, update status, add a comment. We read its docs at kickoff and adjust.
4. We can call an AI model from the event network with a key we control, and we keep that key on the server.
5. The team has 2 to 5 people, with someone strong in each area: UI, data, AI.
6. Nuxt counts as "Vue.js" for the main UI rule. If the organizers say no, we use Vite plus a small server.

## Objective

Build a Vue.js app where a service desk operator watches a live ticket board triage itself.

- **User:** an operator handling many tickets a day.
- **Problem:** long lists, long threads, and repetitive sorting and replying.
- **Promise:** new tickets sort themselves while you watch, every AI step is visible, and every AI change can be undone.

### Priorities

- **P0:** the demo fails without it.
- **P1:** built only once every P0 is polished.
- **P2:** stretch. Cut by default.

### MVP stories

| # | Pri | Story | Done when |
|---|---|---|---|
| 1 | P0 | See all tickets as lanes by status, and switch to a list | Tickets load from the API. Lanes match the API statuses, or our own fallback lanes if it has too few. Each lane shows a count. Loading, empty and error states exist. |
| 2 | P0 | New tickets are triaged automatically and I can watch | Four visible steps: read, classify, prioritize, route. The result shows category, priority, confidence and a one-sentence reason. The card glides to the proposed lane. Low confidence goes to "Needs a human" instead of guessing. |
| 3 | P0 | I choose how much the AI does | Three modes: Off, Suggest, Auto with undo. AI changes are labelled in the accent colour. Undo restores the previous status through the API. A short activity list shows what the AI did. |
| 4 | P0 | I open a ticket and see what to do | Summary of the thread (3 sentences at most), a suggested next step, and an editable draft reply. Sending posts a comment through the API. Status can be changed. |
| 5 | P0 | The presenter can run the full story on any network | A "Simulate incoming ticket" button. A demo mode that uses fixtures and pre-generated AI results when the network or API is down. A visible "Demo data" badge in that mode. A reset button. |
| 6 | P1 | Create a ticket from a sentence | The operator pastes text. AI prefills title, description and priority. The operator reviews, then submits through the API. |
| 7 | P1 | Ask about my tickets (read-only) | A chat panel streams answers through Comark with clickable ticket cards. It cannot change any data. |
| 8 | P1 | Comfortable to use | Dark and light mode. Keyboard shortcuts (`n` new ticket, `u` undo, `/` search). Reduced-motion support. A usable board layout at phone width. |
| 9 | P2 | Stretch | A command that changes tickets (with confirm and undo), voice input, installable offline app, ticket map. |

**Not in the MVP:** login and accounts, attachments, real-time sockets (we simulate arrivals), notifications, translations, a workflow builder, 3D visuals, on-device models.

### Scope control

- If any P0 is not working by hour 3:00, all P1 work stops.
- Feature freeze at 4:15. After that only fixes, the README and rehearsal.
- Anything half-built is either hidden or labelled "prototype" in the demo.

## AI design

- The AI only **proposes**. Every write goes through one layer that records the previous state, so undo always works.
- **Triage route** takes a ticket and returns JSON: `category`, `priority`, `confidence`, `reason`, `lane`. We validate it against a schema. If it is invalid, retry once, then fall back to "Needs a human".
- **Assist route** returns the summary, next step and draft reply for a ticket.
- **Ask route** (P1) streams Markdown.
- **Deterministic guardrails** run before the AI is trusted: words like "outage", "data loss", "security" or "legal" force High priority and "Needs a human". Model confidence is a rough signal, not a guarantee.
- Ticket text is untrusted input. It must never be able to trigger a write, so instructions hidden in a ticket cannot act on their own.
- API keys live in server environment variables only. Requests time out after 8 seconds, then use the fallback.

## Data and API layer

The Mock Ticketing API is the ServiceBridge mock, documented for this repo in [docs/api/README.md](docs/api/README.md) (base URL, endpoints, response shapes, quirks). The UI never talks to it directly:

- We define our own `Ticket`, `Comment` and `StatusId` types.
- One `TicketProvider` interface, with a `MockApiProvider` (written from `docs/api/README.md`) and a `FixtureProvider` (demo mode).
- The mock does not persist writes and has no CORS, so `MockApiProvider` keeps a local overlay of our changes and all calls go through a Nuxt server route or Nitro proxy. Details and the method-to-endpoint mapping are in the API document.

## Tech stack

- Vue 3 and TypeScript.
- Nuxt by default, or Vite with a small server (see assumption 6).
- Nuxt UI and Tailwind CSS for accessible components.
- Comark for streaming AI Markdown and ticket cards.
- AI SDK for the server routes. The model name comes from an environment variable.
- View Transitions API for card movement, with Motion for Vue as the fallback.
- Vitest, Playwright (one smoke test), axe-core.
- Versions: latest stable at kickoff, pinned by the lockfile. Package manager: pnpm.

## Commands (planned, created at kickoff)

```
Install:    pnpm install
Dev:        pnpm dev
Build:      pnpm build
Typecheck:  pnpm typecheck
Lint:       pnpm lint
Unit tests: pnpm test
E2E smoke:  pnpm e2e
```

## Project structure (planned)

```
app/pages/         routes: board, ticket detail
app/components/    FlowBoard, TicketCard, AutopilotBar, ...
app/composables/   useTickets, useAutopilot, useUndo
app/providers/     TicketProvider, MockApiProvider, FixtureProvider
server/api/        AI routes: triage, assist, ask
shared/types.ts    Ticket, Comment, TriageResult
tests/             unit tests, plus e2e/ for the smoke test
docs/              demo script, notes
```

## Code style

```ts
export interface TicketProvider {
  list(): Promise<Ticket[]>
  get(id: string): Promise<Ticket>
  setStatus(id: string, status: StatusId): Promise<Ticket>
  addComment(id: string, body: string): Promise<Comment>
  create(input: NewTicket): Promise<Ticket>
}
```

- `<script setup lang="ts">`, typed props, no `any`.
- PascalCase components, `use`-prefixed composables.
- One accent colour, used only for AI output.
- All motion respects `prefers-reduced-motion`.
- UI text in sentence case.

## Testing strategy

This is a 5-hour event, so we test what would embarrass us on stage:

- **Unit tests (Vitest):** triage result validation and fallback, lane mapping, the undo stack.
- **One Playwright smoke test** of the demo path: load, simulate a ticket, autopilot moves it, undo. Only if time allows.
- **Manual checklist before freeze:** keyboard-only pass, axe scan on board and detail, 390 px and 1440 px widths, dark and light, demo mode with the network off.
- No coverage number.

## Boundaries

- **Always:** run typecheck and lint before pushing. Keep secrets in `.env`. Give every list, detail and AI call loading, empty and error states. Label AI output.
- **Ask first:** adding a dependency outside the stack list. Changing the `TicketProvider` interface. Changing the demo script in the last hour.
- **Never:** commit secrets. Let ticket text trigger a write. Write app code before kickoff. Skip or delete a failing test to make the demo pass. Present demo data as live data.

## Success criteria

- The demo path below runs in 5 minutes or less, rehearsed three times, with no dead ends.
- A new ticket goes from arrival to its lane in 5 seconds or less, or the fallback shows.
- Every AI move can be undone, and the undo persists through the API.
- Board, detail and create work with the keyboard alone.
- axe reports no serious or critical issues on board and detail.
- Layout works at 390 px and 1440 px, in light and dark.
- Demo mode works with the network off.
- No secrets in git history. The README has every item the rules ask for. `pnpm build` passes from a clean clone.

## Demo script (5 minutes)

| Time | Step | Judging category it earns |
|---|---|---|
| 0:00 | The problem in one sentence, then the messy queue | Value, Presentation |
| 0:30 | Board view, toggle to list | UX |
| 0:50 | Simulate a ticket. Watch the four steps, the glide, the reason and confidence. Then a low-confidence ticket lands in "Needs a human" | AI, Creativity |
| 2:20 | Switch to Suggest mode, approve one, undo one | UX, Value |
| 2:50 | Open a ticket: summary, next step, edit the draft, send | Fulfilment, Value |
| 3:50 | Create a ticket from a sentence, or the Ask panel | AI, Fulfilment |
| 4:30 | How we used AI, what is next | Tech, Presentation |

## Open questions

1. Is the topic confirmed, and who registers?
2. Nuxt accepted as Vue.js? Scaffold allowed before kickoff? (ask the organizers)
3. Which AI provider and key do we use at the event? Does the event network allow it?
4. Confirm the operator as the main user.
5. Team size and roles.
6. ~~Which statuses and comment features does the API really have?~~ Answered on 2026-09-29 in [docs/api/README.md](docs/api/README.md): three statuses (new, in_progress, resolved), no comment list, one `updates` endpoint for status and comment. Re-check the snapshots at kickoff.
