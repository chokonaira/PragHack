# TicketFlow AI

> Stop managing tickets. Just tell us what happened.

A service-ticket app for **customers**, built for the PragVue Hackathon 2026 (topic: AI-Powered Ticket Management Experience). Instead of filling in a form, a customer says what went wrong, typed or spoken. AI turns it into a proper request, the customer checks it and creates it, and AI later explains any ticket in plain language.

## Try it in 30 seconds

**Live demo:** https://ticketflow-hack.vercel.app (sample data, safe to play with)

1. Click **Speak** (Chrome, Edge or Safari) and say: *"My laptop keeps shutting down since yesterday's update. I'm at the Prague Nusle office."* Or just type it.
2. Click **Continue**, review the request the AI drafted, and click **Create request**.
3. Open **Laptop shuts down randomly after update** and read the AI summary of its nine updates.
4. **Cross-device handoff:** on a desktop, scan the QR code on the page with your phone, create a request there, and watch it slide into the desktop list within a few seconds.

A full 5-minute walkthrough is in [docs/demo-script.md](docs/demo-script.md).

## Screenshots

| Home | Create by voice or text |
|---|---|
| ![Home: what went wrong, and my requests with a flow line per ticket](docs/screenshots/home.jpg) | ![The AI drafted a request: title, description, type, location, impact and follow-up questions](docs/screenshots/create.jpg) |

| Ticket detail with AI summary | On a phone |
|---|---|
| ![Ticket detail: flow line, AI summary, waiting on, action for you](docs/screenshots/ticket.jpg) | <img src="docs/screenshots/mobile.jpg" alt="The home page on a 390 px phone" width="240"> |

## The problem and our answer

Ticket systems make customers understand the system: long forms, unclear categories, long threads, and no clear answer to "where does my request stand?"

Our answer is a **route**. Every ticket is a line with three stops (Received, In progress, Resolved), so status is obvious at a glance. AI does the paperwork at both ends: it structures what the customer says, and it summarises what happened afterwards.

## How it meets the challenge

The brief asks the app to help people do these things:

| The brief says | What we built |
|---|---|
| Quickly understand current tickets | Live list with a flow line per ticket, status filters and search |
| Create new service requests | Say or type it. AI drafts the request, the customer edits and confirms |
| Communicate with support teams | Reply to support from the ticket page, typed or spoken. The reply lands in the timeline and the AI summary takes it into account |
| Identify important changes | New and updated requests get a tag and a toast, live across devices |
| Find relevant information | Search, and an AI summary of any ticket |
| Decide what to do next | The summary says who the ticket is waiting on and what the customer should do |

## Features

- **Speak or type.** Voice input shows a clear recording state and streams your words into the box as you talk.
- **AI drafts the request.** Title, description, type and impact from free text. The location is only picked when the text names one. The customer can edit anything, and nothing is created until they click. If AI is unavailable, "Skip AI, use the form" gives the same form.
- **Live request list.** A flow line per ticket, filters, search, and automatic refresh. New requests slide in with a tag, even when they come from another device.
- **Ticket detail.** Full-size flow line, description, updates timeline, and a "What's happening?" summary (what is going on, who it is waiting on, what you need to do).
- **Reply to support.** A reply box under the timeline, with the same Speak button. The reply shows at once and is taken back with an error if it cannot be sent.
- **Made to be used.** Works on phones from 320 px, light and dark mode, keyboard operable, no accessibility violations on the main screens (axe), respects reduced motion.
- **Demo mode.** Sample tickets, always labelled "Demo data", so a demo never depends on the network. A demo control on each ticket plays the support side so the flow line can move.

## How it works

```mermaid
flowchart LR
    A["Customer says what went wrong"] --> B["AI drafts: title, type, location, impact"]
    B --> C["Customer reviews and edits"]
    C -->|"Create request"| D["Ticket created"]
    D --> E["Live list, on every device"]
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
    F --> R[("Shared demo state in Redis")]
    API --> L["AI routes /api/ai/*"]
    L --> LLM["Claude, key stays on the server"]
```

The organizers' mock API has no CORS and does not save writes, so the browser never calls it. Our Nuxt server routes call it, keep an overlay of what we create, and fall back to labelled demo data. Demo state lives in Redis so every server instance sees the same tickets, which is what makes the phone-to-desktop handoff work. Details: [docs/api/README.md](docs/api/README.md).

## Technology stack

Nuxt 4, Vue 3, TypeScript, Nuxt UI 4, Tailwind CSS 4, Lucide icons, Schibsted Grotesk. Server routes run on Nitro. Vitest for tests (118), GitHub Actions for lint, typecheck and tests, Vercel for hosting, Redis for shared demo state. Voice input uses the browser's built-in speech recognition.

## Setup and start

You need Node 22 and pnpm (`corepack enable`). No Docker and no database.

```bash
git clone https://git.pragvue.cz/okonkwo.henry2012/ticketflow-ai.git
cd ticketflow-ai
pnpm install
cp .env.example .env      # then edit .env, never commit it
pnpm dev                  # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Development server on port 3000 (`pnpm dev --host` opens it to a phone on the same Wi-Fi) |
| `pnpm build` and `pnpm preview` | Production build and local preview |
| `pnpm lint` and `pnpm typecheck` | Static checks |
| `pnpm test` | Unit tests |

## Configuration

Set in `.env` (see `.env.example`). All server-side. The app runs with none of them set, using the organizers' mock API.

| Variable | Default | What it does |
|---|---|---|
| `NUXT_API_BASE` | `http://mockapi.pragvue.cz:8001` | The organizers' mock ticket API |
| `NUXT_DEMO_MODE` | `false` | `true` uses seeded demo tickets and pre-written AI answers, no network needed |
| `NUXT_AI_LIVE` | `false` | With demo mode on, `true` uses the real model on the demo tickets (needs the key) |
| `NUXT_LLM_PROVIDER` | `anthropic` | `anthropic` or `openai` (any OpenAI-compatible endpoint) |
| `NUXT_LLM_BASE_URL` | `https://api.anthropic.com` | Model API address |
| `NUXT_LLM_MODEL` | `claude-sonnet-5-5` | Model name |
| `NUXT_LLM_API_KEY` | empty | Your key. Never commit it |
| `REDIS_URL` | empty | Any Redis over TCP (`redis://user:password@host:port`). Shares demo state across server instances. Needed on Vercel, not locally |
| `KV_REST_API_URL` and `KV_REST_API_TOKEN` | empty | Alternative to `REDIS_URL` for Upstash Redis |

Without an AI key the app still works: AI screens show the pre-written demo answers, and creating a ticket always works through the manual form.

## AI: tools and value

**In the app:** Claude (Anthropic API, `claude-sonnet-5-5`), called only from our server routes.
- Structures free text into a request. It picks the type and impact, writes a title and description, and suggests details worth adding. It may only choose a location from the real list.
- Summarises a ticket's history: what is happening, who it is waiting on, and what the customer needs to do.
- Safety: ticket text goes to the model as data, never as instructions. Every model answer is validated before use, with a timeout and one retry. If AI fails, the ticket flow still works. AI text is labelled, and nothing is created or sent without the customer's confirmation.

**To build it:** Claude Code (Claude Sonnet 5.5) for planning, UI, code, tests and review.

**Value:** a customer describes a problem once, in their own words, and gets a clean request and a plain-language status instead of a form and a thread to decode.

## Known limitations

- The organizers' mock API saves nothing and returns fixed data. Tickets and comments we create are kept in our own state (Redis on the live site, server memory locally) and expire after 24 hours.
- Customers can reply but cannot change a ticket's status (in real life support does), and there is no support-side screen. The demo control on a ticket page plays support.
- The public site runs in demo mode with pre-written AI answers so the AI key is never exposed. Real AI needs a key (`NUXT_AI_LIVE=true` locally).
- Voice input needs Chrome, Edge or Safari (not Firefox). Chrome sends the audio to Google for recognition. Where unsupported, the mic button is hidden.
- Not built: "since your last visit" summaries, notifications, attachments.
- Demo data is fictional and always labelled.

## Pre-existing components

Started from the Nuxt UI starter template. Libraries used: Nuxt, Nuxt UI, Tailwind CSS, Lucide icons, Vitest, qrcode-generator. Everything else was written during the hackathon.

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
