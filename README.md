# PragHack

Shared workspace for our team at the **PragVue Hackathon 2026**, a 5-hour event to build a working Vue.js prototype.

## Status


Preparation phase. There is no application code yet. Under the hackathon rules all coding happens during the event, so this repo only holds our notes and decisions. The final code must go into the Git repository the organizers assign to each team.

The MVP scope, priorities and success criteria are in [SPEC.md](SPEC.md) (draft for team review).

## Event links

- Portal (topics, announcements, registration): https://hackhub.pragvue.cz/
- Rules: https://hackhub.pragvue.cz/announcements/hackathon-rules

## The idea (proposed)

**In one sentence:** an AI copilot for service desk operators. New tickets sort themselves on a live board while you watch, and every AI step can be undone.

Topic: **AI-Powered Ticket Management Experience** (ServiceBridge). This is our leading option, but it is not final until we register.

### The problem

Support staff work with long ticket lists, long comment threads and repetitive manual steps. It takes too much time to see what matters, what changed and what to do next.

### Who it is for

One main user: the **service desk operator**. We design for them first. A customer-facing view only happens if we have spare time.

### What it does

1. **Flow board with autopilot.** Tickets sit in lanes by status. When a new ticket arrives, the AI reads it, classifies it, sets a priority and routes it, and you watch each step. The card then glides to the right lane with a short reason and a confidence score. Three modes: off, suggest, or auto with undo. Low-confidence tickets go to "Needs a human".
2. **Ticket view that saves reading.** A short summary of a long thread, a suggested next step, and a drafted reply the operator can edit before sending.
3. **Create a ticket from a sentence.** Paste some text and the AI fills in title, description and priority for review.
4. **Ask about your tickets.** A read-only chat whose answers stream in live and include clickable ticket cards.

Only if everything above is polished: a command that changes tickets (with confirm and undo), voice input, an installable offline app, a ticket map.

### Demo highlight

The autopilot flow board. A ticket arrives, the AI triages it while the audience watches, and the operator undoes it with one click.

### Look and feel

- Fast, calm, and usable with the keyboard alone.
- Works on a phone, in dark and light mode.
- One accent colour is used only for things the AI produced, so users can always tell what is AI.
- Smooth motion that respects the "reduce motion" setting. Accessible by default.

### Planned tech

- Vue 3 and TypeScript for the UI (required by the rules).
- A ready-made accessible component library and Tailwind CSS, to move fast.
- [Comark](https://comark.dev/) to render the AI's streaming Markdown replies, including our own ticket cards.
- A small server route that calls the AI, so API keys never reach the browser.
- The browser's View Transitions API (with Motion for Vue as a fallback) for card movement.

We have not seen the Mock Ticketing API yet, so we put a thin layer between the UI and the API. That way a surprise in the API costs us little.

## How the idea scores

| Category | Points | How we go for it |
|---|---|---|
| User Experience and Usability | 25 | Fast, keyboard-friendly, mobile and accessible, with loading, empty and error states |
| User and Business Value | 20 | One clear user and one clear time-saving journey |
| Creativity, Innovation, and AI | 20 | AI that triages on its own, shows its steps, and can be undone, not just a chatbot |
| Challenge Fulfilment | 20 | Use as much of the provided API as possible |
| Technical Quality | 10 | Clean structure, error handling, no secrets in git |
| Final Presentation | 5 | Scripted demo with a backup mode in case the network fails |

## 5-hour plan

| Time | Focus |
|---|---|
| 0:00 to 0:20 | Read the API docs, confirm user and journey, set up the project and design tokens |
| 0:20 to 1:15 | API layer, app shell, board and list with smooth transitions |
| 1:15 to 2:45 | AI features: autopilot triage, the three modes with undo, ticket summary and draft reply |
| 2:45 to 3:45 | Polish the demo highlight, then create-from-a-sentence and the Ask panel if we are on track |
| 3:45 to 4:15 | Loading, empty and error states, demo mode, project README |
| 4:15 to 5:00 | Feature freeze, rehearsal, final push |

## Suggested roles

One person can hold several roles, and we adjust to the team size.

- **UI and design system:** layout, components, animation, accessibility.
- **API layer and data:** typed client, test data, caching.
- **AI features:** server route, prompts, the triage logic.
- **Demo and delivery:** demo script, README, presentation, final push.

## Topics

| Topic | Link |
|---|---|
| Reusable Workplace Planning Calendar | https://hackhub.pragvue.cz/topic/calendar-experience |
| **AI-Powered Ticket Management Experience (leading option)** | https://hackhub.pragvue.cz/topic/ai-powered-servicebridge-ticket-experience |
| Bring Your Own Idea | https://hackhub.pragvue.cz/topic/alternative-challenge-bring-your-own-idea |

Each participant holds one registration at a time, and switching topics releases the previous seat. The ticket topic has 20 seats, so register early.

## Requirements to remember

- The main UI must be built with Vue.js. Vue 3 and TypeScript are recommended.
- Any libraries, APIs, backends and AI tools are allowed. We must be able to explain how we used AI.
- Deliverables: source code in the assigned repo, a short README (description, features, stack, setup, configuration, AI tools used, known limitations), a working prototype, a live demo, and a 5-minute presentation.
- Mention significant pre-existing components or libraries in the presentation.

## Setup

Nuxt project with [Nuxt UI](https://ui.nuxt.com). Install dependencies:

```bash
pnpm install
```

Development server on `http://localhost:3000`:

```bash
pnpm dev
```

Production build and local preview:

```bash
pnpm build
pnpm preview
```

## Working agreements

- Never commit passwords, tokens or API keys. Keep them in a local `.env` file, which is gitignored.
- No application code before the event starts.
- Commit small and push often once coding begins.
- Record decisions in this README or in GitHub issues so everyone sees them.

## Open decisions

- Review and approve [SPEC.md](SPEC.md), including its open questions.
- Confirm the topic and register.
- Confirm the main user (service desk operator).
- Assign the roles above.
- Ask the organizers: is a bare project scaffold (for example `create-vue` or Nuxt) plus dependency installs allowed before kickoff? Is Nuxt accepted as "Vue.js" for the main UI requirement?
