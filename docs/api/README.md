# ServiceBridge mock API

This is the backend for Autopilot Ticket Desk. Every call to the ticket backend, whether written by a person or by an agent, must follow this document. If the live API and this document disagree, the live API wins: fix this document first, then the code.

| Item | Value |
|---|---|
| Base URL | `http://mockapi.pragvue.cz:8001` |
| Swagger UI | http://mockapi.pragvue.cz:8001/servicebridgeapi/docs |
| OpenAPI JSON | http://mockapi.pragvue.cz:8001/servicebridgeapi/openapi.json |
| Mock definition (source of truth) | http://mockapi.pragvue.cz:8001/api/yaml/servicebridgeapi |
| Local snapshots | [servicebridgeapi.openapi.json](servicebridgeapi.openapi.json), [servicebridgeapi.mock.yaml](servicebridgeapi.mock.yaml) |
| Snapshot date | 2026-09-29 |
| Auth | None. No headers needed. |
| Latency | About 50 ms from Prague. |

Re-fetch the snapshots at kickoff (see "Refreshing the snapshots") because the organizers may change the mock before the event.

## Read this first: how the mock behaves

The server is a generic YAML-driven mock (FastAPI, `Server: uvicorn`). It is not a real ticket system. Everything below was verified with `curl` on the snapshot date.

1. **The base URL has no `/servicebridgeapi` prefix.** The Swagger page lives under `/servicebridgeapi/docs`, but the endpoints are served from the root. `GET http://mockapi.pragvue.cz:8001/api/v1/tickets` works. `GET http://mockapi.pragvue.cz:8001/servicebridgeapi/api/v1/tickets` returns 404.
2. **Every response is a fixed example.** The same endpoint always returns the same body. Creating a ticket always returns `MCDTE-50`. Updating a ticket always returns `status: "In progress"`.
3. **Writes are not persisted.** After `POST /api/v1/tickets` the list still has 2 tickets. After `POST /api/v1/tickets/MCDTE-48/updates` with a new status, `GET /api/v1/tickets/MCDTE-48` still shows the old status. The `MockApiProvider` must keep its own overlay of local changes (see "Mapping to TicketProvider").
4. **Request bodies are ignored.** Empty bodies and invalid JSON are accepted. There is no validation, so the API never tells you that a field is missing. Validate on our side.
5. **Query strings are ignored.** `GET /api/v1/tickets?status=New` returns all tickets. Filter, sort and paginate on the client.
6. **Path parameters are echoed back.** `GET /api/v1/tickets/ANY-123` returns a ticket with `issueKey: "ANY-123"`. Every key "exists".
7. **List and detail disagree.** The list returns real-looking summaries ("Point of sale terminal is offline"). The detail for the same key returns `summary: "Mock ticket MCDTE-48"`. Prefer list data for summary and description, and use the detail only for the extra fields (`reporter`, `assignee`, `attachments`).
8. **No CORS headers.** Responses carry no `Access-Control-Allow-Origin`, and `OPTIONS` returns 404. The browser must never call the mock directly. All calls go through a Nuxt server route or a Nitro proxy (see "Calling it from the app").
9. **Errors.** An unknown route or method returns `404` with `{"error": "No matching route for /path"}`. No other error codes were observed. Treat any non-2xx or a network failure as an error state and fall back to demo mode after the 8 second timeout defined in `SPEC.md`.
10. **No comments endpoint.** The only write on a ticket is `POST /api/v1/tickets/{issueKey}/updates`. We use it for both status changes and comments.
11. **The mock server is shared and public.** Do not send real personal data to it. Ticket text you send may be visible to other teams if the organizers log requests.

## Endpoints we use

Only these endpoints matter for the MVP. The full list is further down.

### Tickets

| Method and path | Purpose | Returns |
|---|---|---|
| `GET /api/v1/tickets` | List all tickets | `TicketListItem[]` (2 items in the mock) |
| `GET /api/v1/tickets/{issueKey}` | One ticket with reporter, assignee and attachments | `TicketDetail` |
| `POST /api/v1/tickets` | Create a ticket | `201` with `{ issueKey, id, summary, status }` |
| `POST /api/v1/tickets/{issueKey}/updates` | Change status, add a comment, or both | `200` with `{ issueKey, updatedAt, status }` |
| `GET /api/v1/tickets/create-meta` | Fields the create form needs | `CreateMeta` |
| `GET /api/v1/tickets/{issueKey}/attachments/{attachmentId}/content` | Attachment body | `text/plain`, header `Content-Disposition: attachment; filename="mock-attachment.txt"` |

### Statuses (board lanes)

| Method and path | Purpose | Returns |
|---|---|---|
| `GET /api/v1/statuses` | All statuses, used for the lanes | `Status[]` |
| `GET /api/v1/statuses/by-project/{projectKey}` | Statuses per issue type | `{ projectKey, issueTypes: [{ issueTypeName, statuses: [{ id, name }] }] }` |
| `GET /api/v1/statuses/{statusId}` | One status | `Status` |

The mock has three statuses:

| `id` | `name` | `categoryKey` |
|---|---|---|
| `new` | New | `new` |
| `in_progress` | In progress | `indeterminate` |
| `resolved` | Resolved | `done` |

A ticket's `status` field holds the **name** ("In progress"), not the `id` (`in_progress`). Map by name, case-insensitively, when placing a card in a lane. Our own "Needs a human" lane is app-only and does not exist in the API.

### Catalog (for the create form and for AI routing)

| Method and path | Returns |
|---|---|
| `GET /api/v1/projects` | `[{ id, key, name, projectTypeKey, self }]`, keys `MCDTE` and `SB` |
| `GET /api/v1/projects/{projectKey}` | `{ id, key, name, projectTypeKey, serviceDeskId }` |
| `GET /api/v1/catalog/ticket-types` | `[{ code, name }]`: `incident`, `request` |
| `GET /api/v1/catalog/ticket-groups` | `[{ code, name }]`: `hardware`, `software`, `network` |
| `GET /api/v1/catalog/request-type-groups` | `[{ id, name }]` |
| `GET /api/v1/catalog/request-types` | `[{ requestTypeId, name, description, groupId }]` |
| `GET /api/v1/catalog/restaurants` | `[{ code, name }]`: locations such as `CZ_PHA_NUSLE` |
| `GET /api/v1/catalog/restaurants/create-allowed` | Same shape, locations where creating is allowed |
| `GET /api/v1/catalog/store-areas` | `[{ code, name }]` |
| `GET /api/v1/catalog/device-types` | `[{ code, name }]` |
| `GET /api/v1/catalog/devices` | `[{ code, name }]` |

### Health

| Method and path | Returns |
|---|---|
| `GET /health` | `{ status: "Healthy", version, buildDate, environment: "Mock", database: {...} }` |
| `GET /version` | `{ version: "1.1.0-mock" }` |

Use `GET /health` with a short timeout to decide between live mode and demo mode at startup.

## Response shapes

These are the shapes the mock returns today, written as the TypeScript we will use inside `MockApiProvider`. They are API types, not our domain types. Our `Ticket`, `Comment` and `StatusId` live in `shared/types.ts` and are mapped from these.

```ts
/** GET /api/v1/tickets */
export interface ApiTicketListItem {
  issueKey: string        // "MCDTE-48"
  summary: string
  description: string
  status: string          // status NAME, e.g. "In progress"
  ticketType: string      // "Incident" | "Service request"
  projectKey: string      // "MCDTE"
  location: string        // restaurant code, e.g. "CZ_PHA_NUSLE"
  createdAt: string       // ISO 8601, UTC
  updatedAt: string
}

/** GET /api/v1/tickets/{issueKey} */
export interface ApiTicketDetail extends ApiTicketListItem {
  reporter: string        // display name
  assignee: string        // display name
  attachments: unknown[]  // always [] in the mock
}

/** POST /api/v1/tickets, 201 */
export interface ApiTicketCreated {
  issueKey: string
  id: string
  summary: string
  status: string
}

/** POST /api/v1/tickets/{issueKey}/updates, 200 */
export interface ApiTicketUpdated {
  issueKey: string
  updatedAt: string
  status: string
}

/** GET /api/v1/statuses */
export interface ApiStatus {
  id: string              // "new" | "in_progress" | "resolved"
  name: string            // "New" | "In progress" | "Resolved"
  description: string
  categoryKey: 'new' | 'indeterminate' | 'done'
  categoryName: string
  iconUrl: string | null
}

/** GET /api/v1/tickets/create-meta */
export interface ApiCreateMeta {
  projectKey: string
  requestTypeId: string
  fields: Array<{
    key: string           // "summary" | "description" | "location"
    label: string
    type: 'text' | 'textarea' | 'select'
    required: boolean
    options?: Array<{ value: string; label: string }>
  }>
}
```

Fields the mock does **not** have: `priority`, `comments`, `history`, `tags`. The AI triage result (priority, category, confidence, reason) is stored on our side only.

## Request bodies (our convention)

The mock ignores request bodies, so it does not define them. The Swagger page shows none. We send these shapes so that the code is correct if the organizers swap in a real backend. Keep them stable and validate them with a schema before sending.

```ts
/** POST /api/v1/tickets */
export interface ApiCreateTicketRequest {
  projectKey: string          // "MCDTE"
  requestTypeId: string       // from create-meta or catalog/request-types
  summary: string             // required, max 255
  description?: string
  location?: string           // restaurant code
  ticketType?: string         // "incident" | "request"
}

/** POST /api/v1/tickets/{issueKey}/updates */
export interface ApiTicketUpdateRequest {
  status?: string             // status ID, e.g. "in_progress"
  comment?: string            // plain text; the operator's reply
  assignee?: string
}
```

Send `Content-Type: application/json`. One update call may carry both `status` and `comment`, but the provider sends them separately so that undo can revert a status change without deleting a comment.

## Mapping to TicketProvider

The interface in `SPEC.md` stays unchanged. This is how `MockApiProvider` implements each method.

| Method | API call | Notes |
|---|---|---|
| `list()` | `GET /api/v1/tickets` | Merge the local overlay on top (see below). Add app-side fields (`priority`, `aiTriage`) from the overlay. |
| `get(id)` | `GET /api/v1/tickets/{id}` | Take `reporter`, `assignee`, `attachments` from the detail, but `summary`, `description` and `status` from the list item or the overlay, because the detail returns placeholder text. |
| `setStatus(id, status)` | `POST /api/v1/tickets/{id}/updates` with `{ status }` | On 2xx, record `{ id, previousStatus, newStatus }` in the overlay and the undo stack. Undo sends the same call with `previousStatus`. |
| `addComment(id, body)` | `POST /api/v1/tickets/{id}/updates` with `{ comment }` | The API has no comment list, so the overlay stores comments per ticket and `get()` returns them. |
| `create(input)` | `POST /api/v1/tickets` | The mock always returns `MCDTE-50`. Generate a unique local key (for example `MCDTE-50-a1b2`) when the returned key already exists in the overlay, so two created tickets do not collide. Label such tickets as local in the UI. |

**The overlay** is an in-memory map keyed by `issueKey` that holds every change we made in this session. Because the mock forgets writes, the overlay is the only thing that makes the board reflect an update, and it is what undo restores. It lives in the provider, not in components. It is cleared by the reset button.

## Calling it from the app

The browser cannot call the mock (no CORS). Two allowed options, pick one at kickoff:

1. **Nitro proxy** (least code). In `nuxt.config.ts`, set `routeRules: { '/backend/**': { proxy: 'http://mockapi.pragvue.cz:8001/**' } }` and have `MockApiProvider` use `/backend/api/v1/...`. The base URL comes from `NUXT_PUBLIC_API_BASE` or a server-only `NUXT_API_BASE` environment variable, never a literal in a component.
2. **Server routes** under `server/api/tickets/...` that call the mock with `$fetch` and return our domain types. More code, but the browser never sees API shapes and the overlay can live on the server.

Rules for either option:

- Timeout 8 seconds, then throw. The caller falls back to `FixtureProvider` and shows the "Demo data" badge.
- Never put ticket text into a URL. Use the request body.
- Never forward a header from the browser to the mock.
- Log the method, path and status only. Never log bodies, because ticket text is untrusted input.

## Refreshing the snapshots

Run at kickoff, and again if the organizers announce an API change:

```bash
curl -s http://mockapi.pragvue.cz:8001/servicebridgeapi/openapi.json -o docs/api/servicebridgeapi.openapi.json
curl -s http://mockapi.pragvue.cz:8001/api/yaml/servicebridgeapi -o docs/api/servicebridgeapi.mock.yaml
git diff --stat docs/api
```

If the diff is not empty, read it and update this document before touching the provider. The saved `openapi.json` in this folder has a `servers` entry and a description added by us. The raw file from the server has neither.

Quick smoke test:

```bash
curl -s http://mockapi.pragvue.cz:8001/health
curl -s http://mockapi.pragvue.cz:8001/api/v1/tickets | head -c 400
curl -s -X POST -H 'content-type: application/json' \
  -d '{"status":"resolved"}' http://mockapi.pragvue.cz:8001/api/v1/tickets/MCDTE-48/updates
```

## Full endpoint list

Everything the mock exposes, for completeness. Endpoints outside the tables above are out of MVP scope. Do not build on them without asking.

| Area | Endpoints |
|---|---|
| Health | `GET /health`, `GET /version`, `GET /api/v1/config` |
| Auth (not needed, all routes are public) | `POST /api/v1/auth/login`, `POST /api/v1/auth/jira/login`, `POST /api/v1/auth/jira/login-and-exchange-pat`, `POST /api/v1/auth/keycloak/exchange`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` (204), `GET /api/v1/auth/debug/claims` |
| Projects | `GET /api/v1/projects`, `GET /api/v1/projects/{projectKey}` |
| Catalog | `GET /api/v1/catalog/{ticket-groups, ticket-types, request-type-groups, request-types, restaurants, restaurants/create-allowed, store-areas, device-types, devices}` |
| Statuses | `GET /api/v1/statuses`, `GET /api/v1/statuses/by-project/{projectKey}`, `GET /api/v1/statuses/{statusId}` |
| Info pages | `GET /api/v1/info/categories`, `GET /api/v1/info` |
| Tickets | `GET /api/v1/tickets/create-meta`, `GET /api/v1/tickets`, `POST /api/v1/tickets`, `GET /api/v1/tickets/{issueKey}`, `POST /api/v1/tickets/{issueKey}/updates`, `GET /api/v1/tickets/{issueKey}/attachments/{attachmentId}/content` |
| User settings | `GET /api/v1/users/me/settings`, `PUT /api/v1/users/me/settings` (returns `{ userId, selectedProjectKey, useMockData, notificationsEnabled }`) |
| Admin | `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{userId}/settings` |
| Project configuration | `GET/POST /api/v1/project-configuration`, `GET /api/v1/project-configuration/project/{projectKey}`, `GET/PUT/DELETE /api/v1/project-configuration/{id}`, `PUT .../{id}/fields`, `PUT .../{id}/fields/reorder`, `DELETE .../{id}/fields/{fieldId}`, `PATCH .../{id}/active` |
| Screen parametrization | `GET /api/v1/screen-parametrization`, `GET .../active`, `POST .../`, `POST .../duplicate`, `GET/PUT/DELETE .../{projectKey}/{id}`, `PATCH .../{projectKey}/{id}/active` |

Path parameters appear as `param1` and `param2` in the OpenAPI file. In this document they have real names.

## Other mock projects on the same server

The same host serves three more mocks. They are not part of our backend, but the organizers may mention them. Each has its own Swagger page at `/<project>/docs` and its definition at `/api/yaml/<project>`.

| Project | What it mocks | Relevant to us |
|---|---|---|
| `servicebridgeapiai` | A chat API over tickets: `GET /api/v1/chat/models`, `GET/POST /api/v1/chat/sessions`, `POST /api/v1/chat/sessions/{id}/messages`, confirm and cancel of pending actions | Same fixed-response behaviour, so it cannot power our AI. Its shapes (`toolCalls`, `pendingAction`, `usage`) are a good reference for how the organizers imagine an AI assistant. |
| `mockai` | A generic fake LLM: `POST /mockai/{chat, completions, summarize, classify, sentiment, entities, translate, embeddings, title, keywords}` and error simulators under `/mockai/errors/*` and `/mockai/test/timeout` | Could act as a last-resort fallback for the "AI" step when the real model key is unavailable, but its answers are static. Prefer our pre-generated fixtures. |
| `servicebridgenotification` | Notifications, device registration, Jira webhooks | Out of scope. |

Note that all four projects share one router and all paths are matched on the root, so `/api/v1/...` paths from `servicebridgenotification` and `servicebridgeapiai` are live next to ours. Do not confuse `GET /api/v1/users/jira-link` (notification mock) with ticket endpoints.
