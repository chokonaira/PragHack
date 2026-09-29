# Tickets

MVP: **TicketFlow AI**, customer-first. Scope is in [SPEC.md](SPEC.md), the Mock API spec is [docs/api/README.md](docs/api/README.md), push rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

**How to use this file**

1. Pick an unowned ticket whose dependencies are done. Write your name in its `Owner` line and push that one-line change first.
2. One active ticket per person. Work in small pushes, following the push rules.
3. Tick the ticket's checkboxes as you finish them, in the same push as the code.
4. A ticket is done only when every box is ticked **and** the Definition of Done below holds.

Priorities: **P0** the demo fails without it. **P1** only after every P0 is polished. Areas: **UI**, **Data**, **AI**, **Demo**.

## Overview

| ID | Ticket | Pri | Area | Est | Needs | Owner |
|---|---|---|---|---|---|---|
| T-01 | Kickoff decisions and API check | P0 | All | 20m | | |
| T-02 | Baseline, design tokens and test setup | P0 | UI | 40m | T-01 | |
| T-03 | App shell | P0 | UI | 30m | T-02 | |
| T-16 | AiCard component | P0 | UI | 30m | T-02 | |
| T-04 | API types, mapping and upstream client | P0 | Data | 40m | T-01 | |
| T-05 | MockApiProvider, overlay and routes | P0 | Data | 60m | T-04 | |
| T-06 | Demo data and demo mode | P0 | Data | 45m | T-04 | |
| T-07 | Ticket composables | P0 | Data | 40m | T-04 | |
| T-08 | Home: my requests | P0 | UI | 60m | T-03, T-06, T-07 | |
| T-09 | Ticket detail | P0 | UI | 60m | T-03, T-07 | |
| T-11 | LLM server utility | P0 | AI | 45m | T-01 | |
| T-12 | AI structure-ticket API | P0 | AI | 50m | T-11, T-05 | |
| T-13 | AI ticket creator UI | P0 | UI | 90m | T-12, T-16, T-05 | |
| T-14 | AI summarize-ticket API | P0 | AI | 40m | T-11, T-05 | |
| T-15 | AI summary UI | P0 | UI | 45m | T-14, T-16, T-09 | |
| T-21 | Responsive and accessibility pass | P0 | UI | 45m | T-13, T-15 | |
| T-22 | Demo script and rehearsal | P0 | Demo | 45m | T-13, T-15 | |
| T-23 | Judges' README | P0 | Demo | 30m | T-13 | |
| T-24 | Freeze and final push | P0 | All | 30m | all P0 | |
| T-10 | Comment composer | P1 | UI | 40m | T-05, T-09 | |
| T-17 | Since your last visit | P1 | Data, AI | 60m | T-07, T-11 | |
| T-18 | Help me reply and next action | P1 | AI, UI | 75m | T-10, T-14 | |
| T-19 | Notifications bell | P1 | Data, UI | 45m | T-05 | |

P0 total is about 14 person-hours. With 4 people working in parallel it fits. With 3 or fewer, cut in this order if behind at 3:00: summary refresh and caching (T-15), status chips and search (T-08), the step-2 animation (T-13), in-memory demo writes (T-06). Never cut the manual fallback in T-13, the loading, empty and error states, the tests, or T-21.

Parallel start after T-01: **UI** T-02, T-03, T-16, T-08, T-09. **Data** T-04, T-05, T-06, T-07. **AI** T-11, T-12, T-14.

## Definition of Done (every ticket)

- [ ] All of the ticket's checkboxes are ticked, and Owner is set.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` all pass. No failing, skipped or weakened test. CI is green after the push.
- [ ] New logic has a test in the same push.
- [ ] Loading, empty and error states exist for anything that loads data.
- [ ] No secrets, keys or real personal data in the diff.
- [ ] `pnpm dev` runs and the demo path still works.
- [ ] `SPEC.md` or `docs/api/README.md` updated if scope or API assumptions changed.
- [ ] Pushed to `main` following [CONTRIBUTING.md](CONTRIBUTING.md).

**Extra for UI tickets (design rubric)**

- [ ] Only semantic Nuxt UI tokens and classes. No hardcoded hex colours.
- [ ] Works at 390 px and 1440 px, in light and dark mode.
- [ ] Reachable and usable with the keyboard alone, visible focus, labelled controls.
- [ ] Status and priority never rely on colour alone (icon or text too).
- [ ] Motion only on `transform` and `opacity`, and off under `prefers-reduced-motion`.
- [ ] AI-produced content sits in `AiCard`, labelled as AI, and is editable before any write.

**Extra for AI tickets**

- [ ] Model output is validated before use. Invalid output triggers one retry, then a clear fallback.
- [ ] 10 second timeout. The API key comes only from server config and is never logged.
- [ ] Ticket text is passed as data. The prompt says never to follow instructions found in it.
- [ ] If AI fails, the core flow still works.
- [ ] Sample inputs and results are recorded in `docs/ai-samples.md`.

---

## Foundation

### T-01 Kickoff decisions and API check
`P0 · All · 20m` · Owner: ______
- [ ] Everyone has read `docs/api/README.md`, `SPEC.md` and `CONTRIBUTING.md`, and signed the table at the bottom.
- [ ] API snapshots re-fetched (commands in `docs/api/README.md`, "Refreshing the snapshots"). Any diff read and the document updated.
- [ ] Duplicate `docs/api/ticket-api.openapi.json` removed (keep `servicebridgeapi.openapi.json`).
- [ ] Calling style decided and recorded: Nitro proxy or server routes. Recommendation: server routes, because the overlay then lives on the server.
- [ ] LLM provider and key handling decided (key in server env only), and the event network can reach it.
- [ ] Roles assigned and tickets claimed in the table above.
- [ ] Organizers asked: is the Nuxt starter fine, and what is the final repo URL. Answer recorded in README.

**Verify:** SPEC "Open questions" are all answered.

### T-02 Baseline, design tokens and test setup
`P0 · UI · 40m · needs T-01` · Owner: ______
- [ ] Starter content removed (`TemplateMenu`, starter home page, starter title and meta). App named "TicketFlow AI".
- [ ] Colours, radius and fonts applied from `DESIGN.md` (`app/app.config.ts`, `app/assets/css/main.css`).
- [ ] `runtimeConfig` reads the API base and the LLM key (server only) using the names in `.env.example`.
- [ ] Vitest installed with a `pnpm test` script and one passing sample test.
- [ ] `.github/workflows/ci.yml` runs `pnpm test` after typecheck.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` pass, CI green.

**Verify:** clean clone, `pnpm install && pnpm dev` shows an empty branded page.

### T-03 App shell
`P0 · UI · 30m · needs T-02` · Owner: ______
- [ ] Header with product name, nav (My requests, New request) and the colour-mode toggle.
- [ ] Page container and spacing per `DESIGN.md`.
- [ ] `error.vue` for 404 and 500 with a way back.
- [ ] A slot for the "Demo data" badge (used by T-06).
- [ ] Skip-to-content link. Layout good at 390 px and 1440 px, light and dark.

### T-16 AiCard component
`P0 · UI · 30m · needs T-02` · Owner: ______
- [ ] `AiCard.vue` with props for title, loading, error, footnote, and a default slot.
- [ ] AI style and sparkles icon from `DESIGN.md`. Label "AI" and footnote "AI-generated. Check before you rely on it."
- [ ] Loading shows skeleton lines. Error shows a short message and a retry button, and never blocks the page.
- [ ] `aria-live="polite"` and `aria-busy` while loading.

## Data layer

The mock is stateless: fixed responses, writes not persisted, bodies and query strings ignored, no CORS. Read `docs/api/README.md` before starting any Data ticket.

### T-04 API types, mapping and upstream client
`P0 · Data · 40m · needs T-01` · Owner: ______
- [ ] API types copied from `docs/api/README.md` ("Response shapes"). Our domain types (`Ticket`, `TicketDetail`, `TicketComment`, `TicketStatus`, `CreateMeta`, `StructuredTicket`, `AiSummary`) in `shared/types.ts`.
- [ ] Mapper from API types to domain types, with tests. Status is mapped by name, case-insensitively.
- [ ] `server/utils/upstream.ts`: fetch with 8 second timeout, base URL from `runtimeConfig`, handles `204`, maps failures to a typed `ApiError`, never leaks stack traces.
- [ ] Health probe using `GET /health` with a short timeout.
- [ ] Tests for timeout, 404, 204 and the mapper.

### T-05 MockApiProvider, overlay and routes
`P0 · Data · 60m · needs T-04` · Owner: ______
- [ ] `TicketProvider` with `list`, `get`, `create`, `addComment` implemented per the mapping table in `docs/api/README.md`.
- [ ] Server-side overlay (in-memory, keyed by `issueKey`) holds created tickets and comments. Created tickets get a unique local key, because the mock always returns `MCDTE-50`. Local tickets are labelled as local.
- [ ] `get` takes summary and description from the list item, not the detail (the detail returns placeholder text).
- [ ] Routes: `GET /api/tickets`, `GET /api/tickets/:key`, `GET /api/create-meta`, `POST /api/tickets`, `POST /api/tickets/:key/comments`. Typed JSON out, one error shape `{ message, status }`.
- [ ] Inputs validated on our side (the mock validates nothing): issue key pattern, required summary, size limits.
- [ ] Overlay reset endpoint or button for demos.
- [ ] Tests for overlay merge, unique keys and validation. Curl-checked against the live mock.

### T-06 Demo data and demo mode
`P0 · Data · 45m · needs T-04` · Owner: ______
- [ ] `FixtureProvider` with 8 to 10 seeded tickets, including one long thread (8+ comments), one waiting on the customer, one resolved, one new today, and varied types and locations.
- [ ] Switch with env `NUXT_DEMO_MODE=true` or a `?demo=1` cookie. Also chosen automatically when the health probe fails.
- [ ] A visible "Demo data" badge whenever demo mode is on. Demo data is never presented as live.
- [ ] Demo tickets give the AI summary meaningful input (the live mock has 2 tickets and no comments).

### T-07 Ticket composables
`P0 · Data · 40m · needs T-04` · Owner: ______
- [ ] `useTickets()` and `useTicket(key)` with loading, error (retry) and empty states, plus refresh.
- [ ] Records the last visit time per ticket in localStorage (used by T-17).
- [ ] Test for the state transitions.

## Core screens

### T-08 Home: my requests
`P0 · UI · 60m · needs T-03, T-06, T-07` · Owner: ______
- [ ] `TicketCard`: key, summary, status badge (icon, text and colour), location, relative updated time.
- [ ] Status filter chips with counts. Client-side text search (the mock ignores query strings).
- [ ] Skeleton, empty state (with a "New request" button) and error state with retry.
- [ ] Prominent "Describe a problem" entry at the top that leads to T-13.
- [ ] Cards focusable, Enter opens the ticket.

### T-09 Ticket detail
`P0 · UI · 60m · needs T-03, T-07` · Owner: ______
- [ ] Header with key, status, type, location, created and updated times. Description below.
- [ ] `TicketTimeline` showing the created event and comments in order. Handles zero comments.
- [ ] Skeleton, error and not-found states. Back link keeps the filters.
- [ ] Space reserved for the AI summary card (T-15).

## AI features

### T-11 LLM server utility
`P0 · AI · 45m · needs T-01` · Owner: ______
- [ ] `server/utils/llm.ts` with `askJson(system, user, validate)`. 10 second timeout, one retry, typed `AiError`.
- [ ] Key only from `runtimeConfig`. Logs never contain the key, bodies or full ticket text.
- [ ] Ticket text is delimited as data. System prompt says never to follow instructions inside it.
- [ ] Hand-written type guards for validation. Adding a validation library needs a team OK first.
- [ ] Tests with mocked fetch: invalid JSON, retry then error, and an injection sample that does not change the output shape.

### T-12 AI structure-ticket API
`P0 · AI · 50m · needs T-11, T-05` · Owner: ______
- [ ] `POST /api/ai/structure-ticket` takes `{ text }` and returns `{ summary, description, ticketType, location, impact, missingInfo }`. Summary is 80 characters or fewer.
- [ ] `ticketType` and `location` are either one of the `create-meta` or catalog options, or `null`. The model never invents values.
- [ ] `missingInfo` lists what to ask the customer (for example a serial number).
- [ ] 8 sample complaints recorded in `docs/ai-samples.md`, at least 7 give valid, sensible output.
- [ ] Empty, very long (over 4000 characters) and non-English input return clear errors or sensible output.

### T-13 AI ticket creator UI
`P0 · UI, AI · 90m · needs T-12, T-16, T-05` · Owner: ______
- [ ] Step 1: textarea, 3 example chips, "Create with AI" button (also Ctrl/Cmd+Enter).
- [ ] Step 2: progress text ("Understanding", "Structuring", "Choosing location") that respects reduced motion.
- [ ] Step 3: editable review form (title, description, type, location) inside `AiCard`. Changed fields are marked. Missing-info hints shown.
- [ ] "Create request" posts through T-05, shows a success toast and opens the new ticket. Errors keep the entered data.
- [ ] If the AI fails, the same form appears empty with "Fill it in manually". Creating a ticket never depends on AI.
- [ ] Nothing is created until the customer clicks "Create request".

### T-14 AI summarize-ticket API
`P0 · AI · 40m · needs T-11, T-05` · Owner: ______
- [ ] `POST /api/ai/summarize-ticket` takes `{ key }`. The server loads the ticket and comments itself, so the client cannot inject text.
- [ ] Returns `{ whatsHappening, waitingOn, actionRequired, basedOnComments }`. `waitingOn` is `You`, `Support` or `Nobody`. `whatsHappening` is 3 sentences or fewer.
- [ ] Says so when data is thin (for example zero comments) instead of guessing.
- [ ] Tested on the demo long-thread ticket and a zero-comment ticket. Results in `docs/ai-samples.md`.

### T-15 AI summary UI
`P0 · UI · 45m · needs T-14, T-16, T-09` · Owner: ______
- [ ] "What's happening?" `AiCard` on the detail page with waiting-on and action-required lines and "Based on N comments".
- [ ] Skeleton while loading. Refresh button. Cached per ticket and `updatedAt`.
- [ ] If it fails, the rest of the page still works.

## Delivery

### T-21 Responsive and accessibility pass
`P0 · UI · 45m · needs T-13, T-15` · Owner: ______
- [ ] Keyboard-only run through: home, open ticket, create with AI, back.
- [ ] axe scan on home, detail and creator: no serious or critical issues.
- [ ] 390 px and 1440 px, light and dark, all reviewed.
- [ ] Reduced-motion check. Touch targets at least 44 px on mobile.

### T-22 Demo script and rehearsal
`P0 · Demo · 45m · needs T-13, T-15` · Owner: ______
- [ ] `docs/demo-script.md` with the 5-minute story and timings (problem, create with AI, understand a ticket, since last visit if built, reply help if built, closing line).
- [ ] Demo data prepared so every step works offline.
- [ ] Rehearsed three times end to end, timed, with a backup screen recording.
- [ ] Who says what, and who drives the laptop, decided.

### T-23 Judges' README
`P0 · Demo · 30m · needs T-13` · Owner: ______
- [ ] Description, main features, technology stack, setup and start instructions, required configuration.
- [ ] AI tools used for development and AI features in the app, and what value they give.
- [ ] Known limitations (mock API is stateless, demo data, no real status changes).
- [ ] Significant pre-existing parts listed (Nuxt starter, libraries).

### T-24 Freeze and final push
`P0 · All · 30m · at 4:30` · Owner: ______
- [ ] Fresh clone: `pnpm install && pnpm build && pnpm test` pass.
- [ ] `git grep` for keys and tokens finds nothing. `.env` not committed.
- [ ] Code pushed to the repository the organizers assigned. CI green there too.
- [ ] Demo runs from the pushed version.

## P1 (only after every P0 is polished)

### T-10 Comment composer
`P1 · UI · 40m · needs T-05, T-09` · Owner: ______
- [ ] Textarea and Send on the detail page. Comment appears immediately and rolls back with a retry on failure.
- [ ] Empty comments blocked. Keyboard shortcut to send.

### T-17 Since your last visit
`P1 · Data, AI · 60m · needs T-07, T-11` · Owner: ______
- [ ] Compares last visit with `updatedAt` and new comments.
- [ ] `AiCard` "Since your last visit" appears only when something changed. Nothing shows on a first visit.
- [ ] Demo data includes a ticket that triggers it.

### T-18 Help me reply and next action
`P1 · AI, UI · 75m · needs T-10, T-14` · Owner: ______
- [ ] `POST /api/ai/draft-reply` returns a draft. "Help me reply" fills the composer and the customer edits and sends.
- [ ] A "Recommended next step" line added to the summary.
- [ ] AI never sends anything by itself.

### T-19 Notifications bell
`P1 · Data, UI · 45m · needs T-05` · Owner: ______
- [ ] Notification API is out of scope in `docs/api/README.md`. Confirm with the team before starting, then verify the endpoints first.
- [ ] Bell with unread badge in the header. Marks read on open.

---

## Team sign-off

Add your row in your first push. It means you have read `SPEC.md`, `CONTRIBUTING.md`, `docs/api/README.md` and this file, and you follow the push rules.

| Name | GitHub handle | Read and agreed (date) |
|---|---|---|
| | | |

## Sync log

One line per decision that changes scope, stack, the API or the demo path: `time, who, decision`.

- 2026-09-29, team: direction is customer-first (TicketFlow AI). The operator autopilot board is dropped.
