# Spec: TicketFlow AI (MVP)

**Status:** 3 hours left, tickets are ordered in waves in [TICKETS.md](TICKETS.md). Contracts: [docs/contracts.md](docs/contracts.md). Direction agreed on 2026-09-29: **customer-first**, built on [the implementation plan](pragvue-ai-ticket-management-implementation-plan.md). Tickets are in [TICKETS.md](TICKETS.md). The earlier operator-autopilot idea is dropped. Under the hackathon rules, feature coding starts at kickoff.

## Objective

A customer describes a problem in plain words. AI turns it into a structured ticket, the customer reviews and creates it, and AI later explains what is happening on any ticket.

- **User:** a customer reporting and tracking service issues.
- **Problem:** ticket systems make the customer understand the system: complex forms, long threads, unclear status.
- **Promise:** "Stop managing tickets. Just tell us what happened."
- **AI is embedded in the flow**: create, open, return, reply. It is not a generic chatbot.

## Facts from the API that shape the MVP

Full detail in [docs/api/README.md](docs/api/README.md).

1. The mock is stateless: writes return fixed bodies and are not persisted. We keep a server-side **overlay** of tickets and comments we create, and read it back.
2. No CORS. The browser never calls the mock. Everything goes through Nuxt server routes.
3. The live data is 2 tickets with no comments, and the detail endpoint returns placeholder text. We need **seeded demo data** for long threads and "since your last visit".
4. There is no priority field. AI impact and any priority live on our side only.
5. The mock AI endpoints return canned text. Our AI needs a **real LLM** behind a server route.
6. The mock validates nothing, so we validate all inputs and outputs ourselves.

## Priorities

- **P0:** the demo fails without it.
- **P1:** built only once every P0 is polished.
- **P2:** stretch. Cut by default.

## MVP stories

| # | Pri | Story | Done when | Tickets |
|---|---|---|---|---|
| 1 | P0 | I see my requests | List with key, summary, status, location, updated time. Filter by status, search text. Loading, empty and error states. | T-05, T-08 |
| 2 | P0 | I open a ticket and understand where it stands | Detail with description and timeline. States handled. | T-09 |
| 3 | P0 | I describe a problem and AI structures it into a ticket | Free text in, editable title, description, type and location out, using only real options. I review, then click "Create request". If AI fails I fill the same form manually. | T-11, T-12, T-13 |
| 4 | P0 | AI explains a ticket with a long history | "What's happening?" card: summary, waiting on, action required, based on N comments. Page works if AI fails. | T-14, T-15 |
| 5 | P0 | The presenter can run the story on any network | Demo mode with seeded data and a visible "Demo data" badge. Chosen automatically when the health probe fails. | T-06 |
| 6 | P0 | It is comfortable and accessible | Keyboard, 390 px and 1440 px, light and dark, reduced motion, axe clean. | T-21 |
| 7 | P1 | I reply to a ticket, with AI help | Comment composer. "Help me reply" fills an editable draft. AI never sends. | T-10, T-18 (extras) |
| 8 | P1 | I see what changed since my last visit | AI card listing changes, only when something changed. | T-17 (extra) |
| 9 | P1 | I see notifications | Bell with unread badge. Dropped: notifications are out of scope in the API doc. | none |
| 10 | P2 | Stretch | Voice input, natural-language search, attachment analysis, ticket trends, installable offline app. | none |

**Not in the MVP:** login and accounts, changing ticket status, operator or agent views, boards and lanes, attachments, real-time updates, translations, a generic chatbot.

## Tech stack

Nuxt 4, Nuxt UI 4, Tailwind CSS 4, TypeScript, pnpm. Already scaffolded on `main`. Vitest for tests. A real LLM called from Nuxt server routes (provider decided in T-01). Comark only if a chat view is built. Adding anything outside this list needs a team OK.

## Architecture

- `TicketProvider` interface (`list`, `get`, `create`, `addComment`) with `MockApiProvider` (live mock plus overlay) and `FixtureProvider` (demo data). The UI only sees domain types from `shared/types.ts`.
- Nuxt server routes expose our own JSON. The mock's shapes never reach the browser.
- AI routes live under `server/api/ai/*` and share one `askJson` utility with timeout, retry once, output validation and a typed error.
- Health probe on `GET /health` decides live or demo mode.

## AI design rules

- AI only proposes. Nothing is created or sent until the user confirms.
- If AI fails, creating and reading tickets still works.
- Ticket text is untrusted data, never instructions. The summary route loads ticket data server-side from a key, so the client cannot inject text.
- Model output is validated before use. Invalid output: retry once, then a clear fallback.
- Timeout 10 seconds. Keys only in server env. Logs never hold keys, bodies or ticket text.
- AI output is always labelled, editable, and shown with what it is based on.

## Success criteria

- The demo script runs in 5 minutes or less, rehearsed three times, with no dead ends and a backup recording.
- Creating a ticket works with AI and without AI.
- `pnpm lint`, `pnpm typecheck` and `pnpm test` pass, CI is green, no failing or skipped tests.
- axe reports no serious or critical issues on home, detail and creator.
- Layout works at 390 px and 1440 px, light and dark, keyboard only.
- Demo mode works with the network off, and is always labelled.
- No secrets in git history. `pnpm build` passes from a clean clone.
- The README has every item the rules ask for.

## Demo script (5 minutes)

| Time | Step | Earns |
|---|---|---|
| 0:00 | Problem: ticket systems make customers understand the system | Value, Presentation |
| 0:30 | Home: my requests, filter | UX |
| 1:00 | Create: type "My laptop keeps shutting down since yesterday's update...", watch AI structure it, review, click Create request | AI, Fulfilment, Creativity |
| 2:30 | Open a long thread, "What's happening?" card | AI, Value |
| 3:30 | Since your last visit (if built) | Creativity |
| 4:00 | Help me reply (if built) | AI, Fulfilment |
| 4:30 | How we used AI, limits, what is next. Final line: "Stop managing tickets. Just tell us what happened." | Tech, Presentation |

## Decisions and open questions

Decided: customer-first; Nuxt, Nuxt UI, TypeScript; server routes for all API calls; real LLM behind our own routes; demo data always labelled.

Open, answered in T-01:
1. Nitro proxy or server routes (recommended: server routes).
2. LLM provider and key, and whether the event network reaches it.
3. Is the Nuxt starter accepted by the organizers, and the final repo URL.
4. Team size and roles.
5. `POST /tickets` and `/updates` behaviour, tested once on purpose and recorded in `docs/api/README.md`.
