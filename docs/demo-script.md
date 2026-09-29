# Demo script (5 minutes)

One story, told once: a customer says what went wrong out loud, and the app does the paperwork and keeps them posted. Everything below is what actually works today.

## Before you go on stage (10 minutes before)

Run the demo from the presenter's laptop, not from Vercel. One server, real AI, no surprises.

1. `.env` has `NUXT_DEMO_MODE=true`, `NUXT_AI_LIVE=true` and a valid `NUXT_LLM_API_KEY`. Leave `REDIS_URL` empty locally.
2. `pnpm dev --host`, then open `http://localhost:3000` in **Chrome** (voice input needs it) and allow the microphone once.
3. Reset the sample data: restart `pnpm dev`, or `curl -X POST localhost:3000/api/demo/reset`.
4. Do one dry run of the create step so the AI is warm, then reset again.
5. Put a screen recording of a good run in a tab, as the backup.
6. Optional: open the live site on a phone to show it works on mobile.

## The 5 minutes

| Time | Say | Do | Judges see |
|---|---|---|---|
| 0:00 | "Ticket systems make you understand the system. Forms, categories, threads. We flipped it: just tell us what happened." | Home page on screen. | The problem |
| 0:30 | "Here are my requests. Each one is a route: received, in progress, resolved. It updates live." | Point at the flow lines and the green Live dot. Click a filter tab. | Clean UX, the signature |
| 1:00 | "I'll report a problem the way I'd say it to a colleague." | Click **Speak**. Say: "My laptop keeps shutting down since yesterday's update. It happened three times this morning and I can't work properly. I'm at the Prague Nusle office." Watch the words stream in, then click **Stop**. | Voice, live transcript, clear recording state |
| 1:45 | "One click, and it's structured." | Click **Continue**. Let the three steps play. | The AI moment |
| 2:10 | "Title, type, impact, and it picked the location from what I said. It also tells me what would help support. I can edit anything, and nothing is created until I say so." | Point at the review card. Click **Create request**. | AI that helps and asks first |
| 2:40 | "And there it is, at the top, already on the route." | The new ticket slides in with a highlight. | Smooth handoff |
| 2:55 | "Now the hard part of any ticket: reading a long thread." | Open **Laptop shuts down randomly after update** (9 updates). | Timeline |
| 3:15 | "Instead of reading nine messages: what's happening, who it's waiting on, and whether I need to act." | Point at the summary card. Click Refresh once. | The second AI feature |
| 3:45 | "Some tickets need me." | Open **Cannot connect to store Wi-Fi**. Point at "Action for you". | Value: clear next step |
| 4:10 | "In real life support moves it forward. Let me play support." | Open the ticket you just created. Click **Simulate support update**. The flow line moves and a reply appears. | The flow line in motion |
| 4:30 | "Built with Nuxt and Claude. AI drafts, people decide, and it works without AI too. Stop managing tickets. Just tell us what happened." | Back to the home list. | Close |

Speak slowly. If you run long, cut the filter click and the Refresh click.

## Who does what

- **Presenter:** talks, and speaks the sentence into the microphone.
- **Driver:** hands on keyboard and mouse, one step ahead, watches the clock.
- Decide this before rehearsing. (Names: ________ presents, ________ drives.)

## If something goes wrong

| Problem | What to do |
|---|---|
| Microphone blocked or not heard | Type the sentence instead. Say nothing about it and keep going. |
| AI is slow or errors | The screen falls back to the form. Say "if AI is down, the form still works" and fill it in. |
| Network dies | Set `NUXT_AI_LIVE=false` and restart. Demo mode still works fully offline with pre-written answers (labelled "Demo data"). |
| Data looks wrong | Reset (see above). |
| Everything breaks | Play the backup recording. |

## What each moment earns

| Category | Moment |
|---|---|
| UX and Usability (25) | Home, flow lines, voice recording state, mobile |
| User and Business Value (20) | Speaking a problem, the plain-language summary, "Action for you" |
| Creativity, Innovation, AI (20) | Voice, structured request, the summary of a long thread |
| Challenge Fulfilment (20) | Tickets from the API, create, timeline |
| Technical Quality (10) | Mention: tests, server routes, demo fallback, shared state |
| Presentation (5) | This script, timed |

## Rehearsal log

| Run | Time | Notes |
|---|---|---|
| 1 | | |
| 2 | | |

Target: under 5:00 with 15 seconds to spare.
