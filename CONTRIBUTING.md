# Working rules: trunk-based development

We all work on `main`. Small changes, pushed often, always green. These rules apply to everyone, including AI agents working for us.

## One-time setup (everyone)

```bash
git pull --rebase origin main
pnpm install
cp .env.example .env          # fill in values you were given; never commit .env
```

## Rules for every push

1. **Small.** One idea per push, ideally under 200 changed lines. Push at least every 45 minutes. Big unpushed work causes conflicts.
2. **Rebase first.** Run `git pull --rebase origin main` right before `git push`. Fix conflicts locally. No merge commits.
3. **Never force-push. Never skip checks.** If something blocks you, fix the cause or ask in the team chat.
4. **Lint, typecheck and tests all pass locally.** Run `pnpm lint`, `pnpm typecheck` and `pnpm test` before every push. **No failing test, ever.** Docs-only changes can skip them. (`pnpm test` exists once ticket T-02 lands.)
5. **Never make a test pass by weakening it.** Do not delete, skip (`.skip`, `.only`, `todo`) or loosen a test to get green. Fix the code. If the test itself is wrong, fix it in the same push and explain why in the commit message.
6. **New logic gets a test.** Every new pure-logic function (mapping, validation, overlay, AI output checks) ships with a test in the same push.
7. **No secrets.** No `.env` files, API keys, tokens, passwords or real personal data in any commit. Before pushing, run `git diff origin/main --stat` and look at what is going out.
8. **The app still runs.** For code changes, `pnpm dev` starts and the demo path works. Do not push something half-working onto the demo path. Hide unfinished work behind a flag or leave it unwired.
9. **Ticket ID in the commit message.** Format: `T-12: short imperative summary`. Docs or chores can use `docs:` or `chore:`.
10. **Tick the checklist.** Update the ticket's checkboxes in `TICKETS.md` in the same push.
11. **Watch CI.** After pushing, check the GitHub Actions run (lint, typecheck and tests). Red `main` stops the line: the person who broke it fixes it within 10 minutes or reverts with `git revert` (a new commit). Nobody pushes features until `main` is green again.
12. **Record decisions.** If a push changes scope, stack, API assumptions or the demo path, update `SPEC.md` or `docs/api/README.md` in the same push, and add a line to the sync log in `TICKETS.md`.

## Branches and pull requests

- Default is to push straight to `main`.
- Use a short-lived branch (a few hours at most) only for risky work. Rebase it on `main`, open a pull request, and the author merges it after CI is green.
- AI agents never merge or close pull requests unless their human explicitly asks.

## Avoiding conflicts

Each area has one owner. Touch another area only after telling its owner.

| Area | Folders |
|---|---|
| UI | `app/components`, `app/pages`, `app/assets`, `app/layouts` |
| Data | `server/api` (non-AI), `server/utils`, `server/data`, `app/composables`, `shared/` |
| AI | `server/api/ai`, `server/utils/llm.ts`, prompts, `docs/ai-samples.md` |
| Demo | `docs/`, `README.md`, tests |

Claim a ticket by writing your name in its Owner line in `TICKETS.md` and pushing that one-line change immediately. One active ticket per person.

## Sync points

Pull at the start of every session and before starting a new ticket. During the event, hold a two-minute check-in at 1:15, 2:45 and 3:45: done, next, blocked. Feature freeze is at 4:15.

## Before kickoff

Only docs and the Nuxt starter scaffold are allowed. No feature code. The hackathon rules require all coding to happen inside the 5-hour window, and the final code must be pushed to the repository the organizers assign to the team.

## Where things live

- `README.md`: overview and setup.
- `pragvue-ai-ticket-management-implementation-plan.md`: product plan (customer-first).
- `SPEC.md`: MVP scope and success criteria.
- `docs/contracts.md`: shared types, routes and AI response shapes. Change it in the same push as any shape change.
- `TICKETS.md`: tickets, checklists, Definition of Done, sign-off.
- `docs/api/README.md`: the Mock API spec for this repo (source of truth). OpenAPI and mock snapshots sit next to it.
- `docs/api-notes.md`: extra findings and corrections.
- `CLAUDE.md`: instructions for AI agents.
