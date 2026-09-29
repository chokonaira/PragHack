# PragHack: instructions for Claude Code

Team project for the PragVue Hackathon 2026, a 5-hour build of a Vue.js app called **TicketFlow AI** (customer-first). Read these before working, in this order:

1. [CONTRIBUTING.md](CONTRIBUTING.md): the rules for every push (trunk-based, tests must pass).
2. [docs/contracts.md](docs/contracts.md) and [docs/api/README.md](docs/api/README.md): our shared shapes and the Mock API spec.
3. [pragvue-ai-ticket-management-implementation-plan.md](pragvue-ai-ticket-management-implementation-plan.md): the product plan.
4. [DESIGN.md](DESIGN.md): the design system. **For any UI work, use the `ticketflow-ui` project skill** (`.claude/skills/ticketflow-ui/SKILL.md`, loads automatically in this repo) and, if installed, the `frontend-design` skill too.
5. [SPEC.md](SPEC.md) and [TICKETS.md](TICKETS.md): MVP scope and the tickets. Work from a ticket. Do not build anything that is not in one without asking.

**Phase: BUILD**

The hackathon is running (Henry switched the phase to BUILD). Build from the tickets in `TICKETS.md`, in wave order. The hackathon rules require all coding to stay inside the 5-hour window, and the final code goes to the repository the organizers assign.

## Product in brief

A customer describes a problem in plain words. AI turns it into a structured ticket, the customer reviews and creates it, and later AI explains what is happening on a ticket. Primary user: the customer. Tagline: "Stop managing tickets. Just tell us what happened."

## Stack

Nuxt 4, Nuxt UI 4, Tailwind CSS 4, TypeScript, pnpm (already scaffolded). Vitest for tests. AI calls run in Nuxt server routes and use a real LLM whose key is a server environment variable. Comark renders streaming Markdown if we build a chat view.

## Commands

```
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test          # exists after ticket T-02
```

## Backend API

The ticket backend is the ServiceBridge mock API. Its spec for this repo is [docs/api/README.md](docs/api/README.md), with snapshots of the OpenAPI file and the mock definition next to it. Before writing or changing any code that calls the backend, including `MockApiProvider`, server routes, proxies, fixtures or tests, read that document and follow it. Key facts, all verified:

- Base URL is `http://mockapi.pragvue.cz:8001` with no `/servicebridgeapi` prefix. Swagger UI: http://mockapi.pragvue.cz:8001/servicebridgeapi/docs
- No auth. No CORS, so the browser never calls it directly; go through a Nuxt server route or Nitro proxy.
- The mock is stateless. Writes return fixed bodies and are not persisted, query strings and request bodies are ignored, path parameters are echoed back. The provider keeps a local overlay of our changes.
- Ticket `status` is the status name ("In progress"), status ids are `new`, `in_progress`, `resolved`.
- The mock AI endpoints return canned text. They cannot power our AI features.

If the live API differs from the document, update the document first, then the code. Do not invent endpoints or fields that the document does not list.

## UI work

Every UI change (pages, components, styling, motion, copy) must follow the `ticketflow-ui` skill and `DESIGN.md`: plan first, use tokens only, build the flow-line signature, verify with screenshots at 390 px and 1440 px in light and dark, and never ship a UI that looks like the default starter or a generic SaaS template. If you cannot see the result, say so instead of claiming it looks right.

## Conventions

- `<script setup lang="ts">`, typed props, no `any`.
- PascalCase components, `use`-prefixed composables.
- The UI reaches tickets only through the `TicketProvider` layer and our server routes, never the mock API directly.
- One accent colour, used only for AI output (see `DESIGN.md` once it exists).
- All motion respects `prefers-reduced-motion`.
- UI text in sentence case.
- Every list, detail view and AI call has loading, empty and error states.

## AI and security rules

- The AI only proposes. Nothing is created or sent until the user clicks the confirming button.
- If the AI fails, the core flow (creating and reading tickets) still works.
- Ticket text is untrusted input. It must never be able to trigger a write or change a prompt's instructions.
- Validate every model response before using it. If it is invalid, retry once, then show a clear fallback.
- API keys live in server-side environment variables. Never put them in client code, logs, commits or docs.
- Demo data must be labelled as demo data. Never present it as live.

## Git and tests

Follow [CONTRIBUTING.md](CONTRIBUTING.md). In short:

- Work on `main` in small pushes. Run `git pull --rebase origin main` before every push.
- `pnpm lint`, `pnpm typecheck` and `pnpm test` must all pass before a push. **No failing test, ever.** Never delete, skip or weaken a test to get green.
- Never commit `.env` files, keys or tokens. Never force-push or rewrite history.
- Do not merge or close pull requests unless the user explicitly asks.
- The final code must be pushed to the repository the organizers assign to the team, so check the remote before the final push.

## How to work

- Claim a ticket in `TICKETS.md` (one active ticket per person) and tick its checklist as you go.
- Spec first. If a decision changes, update `SPEC.md` before the code and add a line to the sync log in `TICKETS.md`.
- Make the smallest change that meets the ticket. No extra features.
- Run lint, typecheck and tests before saying something is done. Report failures as they are.
- If a P0 ticket is not working by hour 3:00, stop P1 work. Feature freeze is at 4:15.
- Ask before adding a dependency outside the stack.
