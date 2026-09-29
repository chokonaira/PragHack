# PragHack

Shared workspace for our team at the **PragVue Hackathon 2026**, a 5-hour event to build a working Vue.js prototype.

## Status

Preparation phase. There is no application code yet. Under the hackathon rules all coding happens during the event, so this repo only holds our notes and decisions. The final code must go into the Git repository the organizers assign to each team.

## Event links

- Portal (topics, announcements, registration): https://hackhub.pragvue.cz/
- Rules: https://hackhub.pragvue.cz/announcements/hackathon-rules

## The idea (proposed)

**In one sentence:** an AI copilot for service desk operators that turns a long list of tickets into a short list of things to do, and lets them act by typing or speaking a request.

Topic: **AI-Powered Ticket Management Experience** (ServiceBridge). This is our leading option, but it is not final until we register.

### The problem

Support staff work with long ticket lists, long comment threads and repetitive manual steps. It takes too much time to see what matters, what changed and what to do next.

### Who it is for

One main user: the **service desk operator**. We design for them first. A customer-facing view only happens if we have spare time.

### What it does

1. **Smart inbox.** AI sorts tickets by urgency and groups them by topic. A short "what changed since you last looked" summary sits at the top.
2. **Ticket view that saves reading.** A one-paragraph summary of a long thread, a suggested next step, and a drafted reply the operator can edit before sending.
3. **Command bar** (Ctrl/Cmd + K). The operator types or says what they want, for example "close the resolved Acme tickets and tell them why". The AI shows exactly what it will change and waits for a confirm click. One click undoes it.
4. **Live answers with real controls.** AI replies appear as they are written and can include clickable ticket cards with inline actions, not only plain text.

### Demo highlight

The command bar acting on real tickets, with confirm and undo.

If time is left, we add a "ticket map" where tickets cluster by topic and pulse when new ones arrive. It is only worth building if clicking a cluster filters the list.

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
- Motion for Vue and the browser's View Transitions API for animation.
- If time allows: voice input, an installable offline app (PWA), on-device search for similar tickets.

We have not seen the Mock Ticketing API yet, so we put a thin layer between the UI and the API. That way a surprise in the API costs us little.

## How the idea scores

| Category | Points | How we go for it |
|---|---|---|
| User Experience and Usability | 25 | Fast, keyboard-friendly, mobile and accessible, with loading, empty and error states |
| User and Business Value | 20 | One clear user and one clear time-saving journey |
| Creativity, Innovation, and AI | 20 | AI that takes actions with confirm and undo, not just a chatbot |
| Challenge Fulfilment | 20 | Use as much of the provided API as possible |
| Technical Quality | 10 | Clean structure, error handling, no secrets in git |
| Final Presentation | 5 | Scripted demo with a backup recording in case the network fails |

## 5-hour plan

| Time | Focus |
|---|---|
| 0:00 to 0:20 | Read the API docs, confirm user and journey, set up the project and design tokens |
| 0:20 to 1:15 | API layer, app shell, ticket list and detail with smooth transitions |
| 1:15 to 2:45 | AI features: triage, summary, reply draft, streaming command bar |
| 2:45 to 3:45 | Demo highlight, mobile and accessibility pass |
| 3:45 to 4:15 | Loading, empty and error states, demo mode, project README |
| 4:15 to 5:00 | Feature freeze, rehearsal, final push |

## Suggested roles

One person can hold several roles, and we adjust to the team size.

- **UI and design system:** layout, components, animation, accessibility.
- **API layer and data:** typed client, test data, caching.
- **AI features:** server route, prompts, the command bar logic.
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

## Working agreements

- Never commit passwords, tokens or API keys. Keep them in a local `.env` file, which is gitignored.
- No application code before the event starts.
- Commit small and push often once coding begins.
- Record decisions in this README or in GitHub issues so everyone sees them.

## Open decisions

- Confirm the topic and register.
- Confirm the main user (service desk operator).
- Pick the demo highlight: command bar, ticket map, or both.
- Assign the roles above.
- Ask the organizers: is a bare project scaffold (for example `create-vue` or Nuxt) plus dependency installs allowed before kickoff? Is Nuxt accepted as "Vue.js" for the main UI requirement?
