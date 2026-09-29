# TicketFlow AI

> Stop managing tickets. Just tell us what happened.

TicketFlow AI is a customer-facing service ticket app built for the **PragVue Hackathon 2026** (topic: AI-Powered Ticket Management Experience, ServiceBridge). A customer describes a problem in their own words, typed or spoken. AI turns it into a structured request, the customer reviews it and creates it, and later AI explains what is happening on any ticket.

**Live demo:** https://ticketflow-hack.vercel.app (sample data, deploys from every push to `main`)

**Try the handoff (30 seconds):** open the live demo on your laptop, scan the QR code on the page with your phone, then on the phone tap the mic (or type) and report a problem. Create the request and watch it slide into the laptop's list within a few seconds, with a "New" tag.

## The problem

Ticket systems make customers understand the system: long forms, unclear categories, long threads, and no clear answer to "where does my request stand?"

## Features

- **Describe it, don't fill in a form.** Type or speak what went wrong. The words stream into the box as you talk, with a clear recording state.
- **AI drafts the request.** Title, description, type and impact from free text, with the location picked only when the text names one. The customer edits anything and confirms. Nothing is created until they click. If AI is unavailable, "Skip AI, use the form" gives the same form.
- **My requests.** A live list of tickets. Each one shows a flow line (Received, In progress, Resolved), its location and last update. Filter by status. The list refreshes itself and new tickets slide in.
- **Ticket detail.** The flow line at full size, the description, an updates timeline, and a "What's happening?" summary: what is going on, who the ticket is waiting on, and whether the customer needs to act.
- **Built to be used.** Works on phones from 320 px, light and dark mode, keyboard operable, no accessibility violations on the main screens (axe), respects reduced motion.
- **Demo mode.** Seeded sample tickets, always labelled "Demo data", so the demo never depends on the network. A demo control plays the support side so the flow line can move.

## How it works

```mermaid
flowchart LR
    A["Customer describes the problem"] --> B["AI structures it: title, type, location, impact"]
    B --> C["Customer reviews and edits"]
    C -->|"Create request"| D["Ticket created"]
    D --> E["My requests"]
    E --> F["Open a ticket"]
    F --> G["AI summary: what is happening, waiting on, action needed"]
```

```mermaid
flowchart TB
    UI["Browser: Nuxt UI pages"] --> API["Nuxt server routes /api/*"]
    API --> P{"TicketProvider"}
    P -->|"live"| M["MockApiProvider + overlay of our changes"]
    P -->|"demo"| F["FixtureProvider: seeded demo data"]
    M --> S["ServiceBridge mock API"]
    API --> L["AI routes /api/ai/*"]
    L --> LLM["Claude, key stays on the server"]
```

The organizers' mock API has no CORS and does not save writes, so the browser never calls it. Our Nuxt server routes call it, keep an overlay of what we create, and fall back to labelled demo data. Details: [docs/api/README.md](docs/api/README.md).

## Technology stack

Nuxt 4, Vue 3, TypeScript, Nuxt UI 4, Tailwind CSS 4, Lucide icons, Schibsted Grotesk. Server routes run on Nitro. Vitest for tests, GitHub Actions for lint, typecheck and tests, Vercel for hosting. The browser's built-in speech recognition powers voice input.

## Setup and start

You need Node 22 and pnpm (`corepack enable`). No Docker and no database.

```bash
git clone <this repository>
cd <folder>
pnpm install
cp .env.example .env      # then edit .env, never commit it
pnpm dev                  # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Development server on port 3000 (`pnpm dev --host` to open it from a phone on the same Wi-Fi) |
| `pnpm build` and `pnpm preview` | Production build and local preview |
| `pnpm lint` and `pnpm typecheck` | Static checks |
| `pnpm test` | Unit tests |

## Configuration

Set in `.env` (see `.env.example`). All of these are server-side.

| Variable | Default | What it does |
|---|---|---|
| `NUXT_API_BASE` | `http://mockapi.pragvue.cz:8001` | The organizers' mock ticket API |
| `NUXT_DEMO_MODE` | `false` | `true` uses seeded demo tickets and pre-written AI answers, no network needed |
| `NUXT_AI_LIVE` | `false` | With demo mode on, `true` uses the real model on the demo tickets (needs the key) |
| `NUXT_LLM_PROVIDER` | `anthropic` | `anthropic` or `openai` (any OpenAI-compatible endpoint) |
| `NUXT_LLM_BASE_URL` | `https://api.anthropic.com` | Model API address |
| `NUXT_LLM_MODEL` | `claude-sonnet-5-5` | Model name |
| `NUXT_LLM_API_KEY` | empty | Your key. Never commit it |
| `REDIS_URL` | empty | Any Redis over TCP (for example Railway), as `redis://user:password@host:port`. Shared demo state across server instances. Keep it secret |
| `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) | empty | Upstash Redis for shared demo state. Vercel's integration sets them. Without them, demo state lives in each server instance's memory |

Without a key the app still works: AI screens show the pre-written demo answers, and creating a ticket always works through the manual form.

## AI: tools and value

**In the app:** Claude (Anthropic API, `claude-sonnet-5-5`), called only from our server routes.
- Structures free text into a request. It picks the type and impact, proposes a title and description, and suggests details worth adding. It may only choose a location from the real list.
- Summarises a ticket's history into what is happening, who it is waiting on, and what the customer needs to do.
- Safety: ticket text is passed to the model as data, never as instructions. Every model answer is validated before use, with a timeout and one retry. If AI fails, the ticket flow still works. AI answers are labelled, and nothing is created or sent without the customer's confirmation.

**To build it:** Claude Code (Claude Sonnet 5.5) for planning, UI, code, tests and review. *Teammates: add the AI tools you used here.*

**Value:** customers describe a problem once, in their own words, and get a clean request and a plain-language status instead of a form and a thread to decode.

## Known limitations

- The organizers' mock API does not save anything and returns fixed data. Tickets and comments we create live in our server's memory and reset on restart. On Vercel each request may hit a different server copy, so shared demo state needs the Upstash Redis variables above. Without them, run locally for the live demo.
- Customers cannot change a ticket's status. In real life support does. The demo control on a ticket page plays support.
- The public site runs in demo mode with pre-written AI answers so the AI key is never exposed. Real AI needs a key (`NUXT_AI_LIVE=true` locally).
- Voice input needs Chrome, Edge or Safari (not Firefox). Chrome sends the audio to Google for recognition. Without support the mic button is hidden.
- Not built: replying to a ticket, "since your last visit" changes, notifications, and text search.
- Demo data is fictional and always labelled.

## Pre-existing components

Started from the Nuxt UI starter template. Libraries used: Nuxt, Nuxt UI, Tailwind CSS, Lucide icons, Vitest. Everything else was written during the hackathon.

---

## For the team

| File | What it is |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Trunk-based rules for every push (lint, typecheck and tests pass, no failing test ever, no secrets) |
| [TICKETS.md](TICKETS.md) | Tickets with done-checklists, plan, sign-off, sync log |
| [SPEC.md](SPEC.md) | MVP scope, stories, success criteria |
| [docs/demo-script.md](docs/demo-script.md) | The 5-minute demo, who says what, fallbacks |
| [docs/contracts.md](docs/contracts.md) | Shared types, routes and AI response shapes |
| [docs/ai-samples.md](docs/ai-samples.md) | AI test samples and results |
| [DESIGN.md](DESIGN.md) | Colours, type, motion, component and accessibility rules |
| [docs/api/README.md](docs/api/README.md) | Mock API spec for this repo |
| [CLAUDE.md](CLAUDE.md) | Instructions for AI coding agents (loads the `ticketflow-ui` skill) |

Event links: [portal](https://hackhub.pragvue.cz/), [rules](https://hackhub.pragvue.cz/announcements/hackathon-rules), [mock API Swagger](http://mockapi.pragvue.cz:8001/servicebridgeapi/docs).
