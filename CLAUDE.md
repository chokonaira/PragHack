# PragHack: instructions for Claude Code

Team project for the PragVue Hackathon 2026, a 5-hour build of a Vue.js app called "Autopilot Ticket Desk". Read [SPEC.md](SPEC.md) first and [README.md](README.md) for context. Both are drafts that the team updates as decisions change.

**Phase: PREP**

While the phase is PREP, only edit docs (`README.md`, `SPEC.md`, `CLAUDE.md`, `docs/`). Do not scaffold the app, install dependencies or write application code. The hackathon rules require all coding to happen inside the 5-hour window. A teammate changes the phase line to **Phase: BUILD** at kickoff. Do not change it yourself.

## Product in brief

An AI copilot for service desk operators. Tickets sit on a live board. New tickets are triaged by AI while the operator watches (read, classify, prioritize, route), and every AI change can be undone. The MVP scope and priorities (P0, P1, P2) are in `SPEC.md`. Do not build anything outside them without asking.

## Stack

Vue 3 and TypeScript, Nuxt (or Vite plus a small server, pending the organizers' answer), Nuxt UI and Tailwind CSS, Comark for streaming AI Markdown, AI SDK for server routes, View Transitions API for card movement, Vitest, Playwright, axe-core. Package manager: pnpm. Details and versions are in `SPEC.md`.

## Commands

These exist only after kickoff:

```
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e
```

## Conventions

- `<script setup lang="ts">`, typed props, no `any`.
- PascalCase components, `use`-prefixed composables.
- The UI talks to tickets only through the `TicketProvider` interface, never to the API directly.
- One accent colour, used only for AI output.
- All motion respects `prefers-reduced-motion`.
- UI text in sentence case.
- Every list, detail view and AI call has loading, empty and error states.

## AI and security rules

- The AI only proposes. Every write goes through one layer that records the previous state, so undo always works.
- Ticket text is untrusted input. It must never be able to trigger a write or change a prompt's instructions.
- Validate every model response against a schema. If it is invalid, retry once, then fall back to "Needs a human".
- API keys live in server-side environment variables. Never put them in client code, logs, commits or docs.
- Demo data must be labelled as demo data. Never present it as live.

## Git

- Small commits with clear messages. Push often.
- Never commit `.env` files, keys or tokens.
- Never force-push or rewrite history on `main`.
- Do not merge or close pull requests unless the user explicitly asks.
- The final code must be pushed to the repository the organizers assign to the team, so check the remote before the final push.

## How to work

- Spec first. If a decision changes, update `SPEC.md` before the code.
- Make the smallest change that meets the current task. No extra features.
- Run typecheck, lint and tests before saying something is done. Report failures as they are.
- If a P0 story is not working by hour 3:00, stop P1 work. Feature freeze is at 4:15.
- Ask before adding a dependency outside the stack, or before changing the `TicketProvider` interface.
