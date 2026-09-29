# Mock API: verified notes

Checked on 2026-09-29 with `curl` from one team laptop. The organizers' guide is at https://hackhub.pragvue.cz/announcements/mock-api-guide and it says Swagger is the source of truth. The OpenAPI files we downloaded are in [docs/api/](api/). The mock data may be shared and may reset, so re-check anything critical.

## Services and docs

| Service | Swagger | OpenAPI copy |
|---|---|---|
| Ticket Management | http://mockapi.pragvue.cz:8001/servicebridgeapi/docs | [ticket-api.openapi.json](api/ticket-api.openapi.json) |
| Ticket AI | http://mockapi.pragvue.cz:8001/servicebridgeapiai/docs | [ticket-ai-api.openapi.json](api/ticket-ai-api.openapi.json) |
| Notification | http://mockapi.pragvue.cz:8001/servicebridgenotification/docs | [notification-api.openapi.json](api/notification-api.openapi.json) |
| MockAI | http://mockapi.pragvue.cz:8001/mockai/docs | [mockai.openapi.json](api/mockai.openapi.json) |

## Surprises (differences from the guide)

1. **Base URL.** The guide says the ticket base URL is `http://mockapi.pragvue.cz:8001/servicebridgeapi`. Live calls to `/servicebridgeapi/api/v1/...` returned `404 No matching route`. The routes that worked are at the host root: `http://mockapi.pragvue.cz:8001/api/v1/...`. Keep the base URL in an environment variable so we can change it in one place.
2. **MockAI is not at `/mockai/v1/*`.** `GET /mockai/v1/models` and `POST /mockai/v1/chat/completions` returned 404. The OpenAPI file lists `/mockai/chat`, `/completions`, `/summarize`, `/classify`, `/sentiment`, `/entities`, `/translate`, `/embeddings`, `/title`, `/keywords`, `/models`, `/usage`, `/conversations`, plus error simulators. We have not tested `/mockai/chat` or the embeddings endpoint.
3. **No status update.** The ticket API has no endpoint to change a ticket's status. Writes are only `POST /api/v1/tickets` (create) and `POST /api/v1/tickets/{issueKey}/updates` (comment or attachment, body not yet verified). This ruled out the operator "autopilot board" idea.
4. **Canned AI output.** `POST /mockai/summarize`, `/classify` and `/title` returned generic text unrelated to the input (for example category "Technology", confidence 0.97, title "Business Process Improvement Initiative"). They cannot power a believable summary or ticket creator. We need a real model behind our own server route.
5. **Tiny dataset.** `GET /api/v1/tickets?page=1&pageSize=100` returned only 2 tickets (`MCDTE-48`, `MCDTE-49`). Neither has comments. The detail response has no `comments` key. Long conversations and "since your last visit" need our own seeded demo data.
6. **CORS.** A `GET` with an `Origin` header returned no `Access-Control-Allow-Origin`, and an `OPTIONS` preflight on `/api/v1/tickets` returned 404. Browser calls from `localhost:3000` will probably fail for JSON `POST`. Call the mock APIs from Nuxt server routes (`server/api/*`), not from the browser. Not yet confirmed from a real browser.

## Ticket Management API (what we saw)

- Reads worked with no login. Auth endpoints exist but we have not used them.
- `GET /api/v1/statuses` returns three statuses: `new` (New), `in_progress` (In progress), `resolved` (Resolved).
- `GET /api/v1/tickets` returns a JSON array. Fields: `issueKey`, `summary`, `description`, `status` (display name), `ticketType` (`Incident` or `Service request`), `projectKey` (`MCDTE`), `location` (for example `CZ_PHA_NUSLE`), `createdAt`, `updatedAt`. There is no priority field.
- `GET /api/v1/tickets/{issueKey}` adds `reporter`, `assignee`, `attachments`.
- `GET /api/v1/tickets/create-meta` returned `projectKey: MCDTE`, `requestTypeId: "101"` and fields: `summary` (text, required), `description` (textarea, optional), `location` (select, required, option `CZ_PHA_NUSLE` "Prague Nusle").
- Catalog endpoints exist under `/api/v1/catalog/*`. Not explored.
- We have **not** tested `POST /api/v1/tickets` or `/updates`, to avoid polluting shared data. Test them once, on purpose, and record the result here.

## Ticket AI API (what we saw)

- `GET /api/v1/chat/models` returned provider `local`, default model `llama3.2`, also `mistral`, both `supportsTools: true`.
- `POST /api/v1/chat/sessions` then `POST /api/v1/chat/sessions/{id}/messages` worked. For "Summarize ticket MCDTE-48 in one sentence." it answered "Ticket MCDTE-48 is currently In progress." and ran a `search_tickets` tool call. Timestamps are fixed at 2026-09-18, so it looks scripted.
- The guide describes proposed write actions with `pendingAction`, `confirm` and `cancel`. Not seen in our test.

## What this means for our build

- Customer-first MVP (TicketFlow AI). No status changes, no board lanes.
- Our AI features (ticket creator, summary, changes, reply help) need a real LLM through a Nuxt server route. The API key is a server environment variable and never goes in git.
- Seed our own demo tickets and comments for the demo path, labelled as demo data.
- Put every base URL in `.env` (see `.env.example`).

## Not yet tested

Notification API, attachments, auth endpoints, `POST /tickets`, `POST /tickets/{key}/updates`, MockAI chat and embeddings, browser CORS behavior.
