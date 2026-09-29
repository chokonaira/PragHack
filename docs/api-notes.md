# Mock API: extra notes and corrections

The source of truth for our backend is [api/README.md](api/README.md). This file only holds findings that are not there, and corrections to what we first assumed. Checked on 2026-09-29 with `curl`. The mock may be shared and may reset.

## Correction

We first wrote that the ticket API has no status-update endpoint and that this ruled out a status-changing board. That was wrong. `POST /api/v1/tickets/{issueKey}/updates` exists and is meant for status changes and comments. What is true: the mock ignores request bodies and does not persist anything, so any change must live in our own overlay. See "Read this first" in `api/README.md`.

## Organizers' guide vs the live server

The guide is at https://hackhub.pragvue.cz/announcements/mock-api-guide. It says Swagger is the source of truth, and it differs from the live server in these ways:

1. The ticket base URL in the guide has a `/servicebridgeapi` prefix. Live routes have none.
2. The guide describes MockAI at `/mockai/v1/models` and `/mockai/v1/chat/completions` (OpenAI-compatible). Both returned `404 No matching route`. The OpenAPI file lists `/mockai/chat`, `/completions`, `/summarize`, `/classify`, `/sentiment`, `/entities`, `/translate`, `/embeddings`, `/title`, `/keywords`, and error simulators.
3. The guide's env names use the `VITE_` prefix. We use Nuxt, so server-side values use `NUXT_` names (see `.env.example`).
4. The guide shows ticket fields `id` and `key`. The live list uses `issueKey`.
5. The guide says a ticket detail may include `comments`. The live detail has none.

## AI endpoints we tried

- `POST /mockai/summarize`, `/classify`, `/title` with a laptop-shutdown complaint returned generic text unrelated to the input (category "Technology" with confidence 0.97, title "Business Process Improvement Initiative"). Not usable for a believable demo.
- Ticket AI: `GET /api/v1/chat/models` lists provider `local` with `llama3.2` and `mistral`. A session plus message asking to summarize `MCDTE-48` returned "Ticket MCDTE-48 is currently In progress." with a `search_tickets` tool call and fixed 2026-09-18 timestamps, so it looks scripted.
- Decision: our AI features use a real LLM through our own server routes. The mock AI stays a possible last-resort fallback only.

## Not yet tested

`POST /api/v1/tickets` and `/updates` (Florian's document reports fixed replies), notification endpoints, attachments, browser-side CORS behaviour.
