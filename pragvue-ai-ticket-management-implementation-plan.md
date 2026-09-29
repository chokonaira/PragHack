# AI-Powered Ticket Management Experience

## PragVue Hackathon 2026 --- Implementation Plan

## 1. Product Concept

### TicketFlow AI

**Primary target user:** Customers reporting and tracking service
issues.

The core idea:

> A customer shouldn't need to understand ticket systems. They should
> just explain their problem, and AI handles the complexity.

### Core Journey

``` text
"I have a problem"
       ↓
Describe naturally
       ↓
✨ AI understands it
       ↓
Creates structured ticket
       ↓
Track progress simply
       ↓
✨ AI explains updates
       ↓
Continue conversation
       ↓
Resolve
```

The application should feel less like a traditional ticket-management
system and more like an intelligent assistant embedded directly into the
support workflow.

------------------------------------------------------------------------

## 2. Technical Foundation

### Stack

-   Nuxt
-   Nuxt UI
-   TypeScript
-   Vite
-   Mock Ticketing REST API
-   AI API

Keep the architecture intentionally simple for the hackathon.

### Suggested Structure

``` text
src/
├── components/
│   ├── TicketCard.vue
│   ├── TicketTimeline.vue
│   ├── TicketComposer.vue
│   ├── AiTicketCreator.vue
│   ├── AiSummary.vue
│   └── ImportantChanges.vue
│
├── views/
│   ├── HomeView.vue
│   ├── TicketView.vue
│   └── CreateTicketView.vue
│
├── services/
│   ├── ticketApi.ts
│   └── aiApi.ts
│
├── composables/
│   ├── useTickets.ts
│   └── useAI.ts
│
└── types/
    └── ticket.ts
```

Use the Composition API, typed API models, small reusable components,
and clear loading/error states.

------------------------------------------------------------------------

## 3. Phase 1 --- Mock Ticketing API Integration

Before building the AI experience, establish the basic ticket workflow.

Implement the API layer separately from the UI.

``` ts
getTickets()
getTicket(id)
createTicket(data)
updateTicket(id, data)

getComments(ticketId)
addComment(ticketId, comment)

// Only if supported by the provided API
uploadAttachment()
```

### Definition of Done

The application can perform the following flow against the provided API:

``` text
List tickets
    ↓
Open ticket
    ↓
Create ticket
    ↓
Update ticket
    ↓
Add comment
```

This becomes the reliable foundation and fallback demo.

------------------------------------------------------------------------

## 4. Phase 2 --- Smart Home

The challenge asks users to **quickly understand their current
tickets**.

Instead of starting with a traditional ticket table, make the dashboard
answer:

> What needs my attention?

Example:

``` text
Good morning 👋

3 tickets need your attention

┌──────────────────────────────────────┐
│ 🔴 Internet connection issue        │
│ Support needs information from you  │
│ 10 minutes ago                      │
│                                      │
│                         Respond →    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 🟢 Laptop replacement               │
│ Technician scheduled                │
│ Tomorrow · 10:00                    │
│                                      │
│                         View →       │
└──────────────────────────────────────┘

Other requests

✓ VPN access              Resolved
⏳ Monitor issue          In progress
```

Prioritize tickets requiring action instead of simply showing everything
chronologically.

------------------------------------------------------------------------

## 5. Phase 3 --- AI Ticket Creator ⭐

This is the main hackathon feature.

Traditional ticket systems often require users to understand categories,
priorities, departments, and technical terminology.

Replace that with one simple question:

### What happened?

``` text
┌──────────────────────────────────────────┐
│ Tell us what's wrong...                  │
│                                          │
│ My laptop started shutting down randomly │
│ after yesterday's update. It happened    │
│ three times this morning.                │
│                                          │
└──────────────────────────────────────────┘

🎤 Speak       📎 Add screenshot

                         Continue →
```

AI converts the natural-language description into structured ticket
information.

Example output:

``` text
✨ I understood your issue

Laptop randomly shuts down after update

Category
Hardware / Laptop

Impact
Unable to work reliably

Priority
High

Summary
Laptop started unexpectedly shutting down
following yesterday's system update.

Possible useful information
• Device model
• Operating system version
```

Actions:

``` text
[ Edit ]             [ Create request ]
```

### Important Principle

AI proposes the ticket structure.

**The user reviews and confirms it before the ticket is created.**

------------------------------------------------------------------------

## 6. Phase 4 --- AI Ticket Summary ⭐

The challenge specifically mentions large amounts of information and
long communication histories.

Instead of requiring the customer to read 20 comments, show an
AI-generated status explanation at the top of the ticket.

Example:

``` text
✨ What's happening?

Your laptop replacement has been approved.

IT confirmed the hardware problem yesterday.
A replacement device has been ordered.

Current status
🟡 Waiting for replacement device

Waiting on
IT Support

You need to do
Nothing right now.

[ View full conversation ]
```

The full ticket history remains available, but users get the important
information immediately.

------------------------------------------------------------------------

## 7. Phase 5 --- Important Change Detection ⭐

The challenge explicitly asks the application to help users **identify
important changes**.

When a user returns to a ticket, show what changed since their previous
visit.

Example:

``` text
✨ Since your last visit

2 important things changed

✓ Technician confirmed hardware failure

📦 Replacement laptop has been ordered

No action needed from you.
```

If action is required:

``` text
🔴 Action required

Support asked for your laptop serial number.

[ Reply ]
```

The application should answer two questions immediately:

1.  What changed?
2.  What should I do?

------------------------------------------------------------------------

## 8. Phase 6 --- AI Next Action

Every ticket can include an AI-generated recommended next step.

Example when action is required:

``` text
✨ Recommended next step

Support is waiting for your device serial number.

[ Find serial number ]
```

Example when nothing is required:

``` text
✨ Nothing needed from you

The support team is currently investigating.

We'll let you know when something changes.
```

This directly addresses the challenge requirement to help users **decide
what to do next**.

------------------------------------------------------------------------

## 9. Phase 7 --- Smart Communication

Inside the ticket conversation, provide:

``` text
Write a reply...

✨ Help me reply
```

If support writes:

> Please provide your device serial number and Windows version.

AI can simplify the request:

``` text
Support needs two things:

1. Your laptop serial number
2. Your Windows version

[ Where to find them ]
```

It can also prepare a response:

``` text
Hi,

The serial number is ______.

I'm running Windows ______.

Thanks.
```

The user reviews and edits the response before submitting it through the
ticket API.

------------------------------------------------------------------------

## 10. AI Should Be Embedded, Not Bolted On

Avoid making a generic chatbot the primary feature.

Instead, integrate AI directly into the workflow.

``` text
Create
   → AI structures the problem

Open
   → AI summarizes the ticket

Return
   → AI highlights important changes

Read
   → AI explains support requests

Reply
   → AI assists with the response

Next step
   → AI recommends what to do
```

This makes AI useful rather than decorative.

------------------------------------------------------------------------

## 11. Hackathon Build Priority

If there are approximately four hours available:

### Hour 1 --- Foundation

-   Vue/Vite setup
-   TypeScript models
-   API service
-   Ticket list
-   Ticket details
-   Create/update/comment workflow

### Hour 2 --- Core UX

-   Smart Home
-   Ticket cards
-   Ticket timeline
-   Create-ticket experience
-   Loading/error/empty states

### Hour 3 --- AI

Implement the two essential AI features:

1.  AI Ticket Creator
2.  AI Ticket Summary

If time remains:

3.  Important Change Detection
4.  Recommended Next Action

### Hour 4 --- Demo & Polish

-   AI reply assistance
-   UI polish
-   Responsive layout
-   Small transitions
-   Fix demo-path bugs
-   Seed useful demo data
-   Rehearse presentation

------------------------------------------------------------------------

## 12. Priority Order

Build in this order:

``` text
1. Mock Ticketing API
          ↓
2. Basic Ticket UI
          ↓
3. AI Ticket Creator
          ↓
4. AI Ticket Summary
          ↓
5. Important Changes / Next Action
          ↓
6. AI Reply Assistance
          ↓
7. Visual Polish
```

Do not sacrifice the first four items to implement optional features.

------------------------------------------------------------------------

## 13. What Not to Spend Hackathon Time On

Unless explicitly required:

-   Complex authentication
-   Elaborate state-management architecture
-   Large design-system setup
-   Multiple AI agents
-   Complicated backend abstractions
-   Excessive routing
-   Full test coverage
-   Generic chatbot
-   Features not used in the demo

Prioritize a polished end-to-end experience.

------------------------------------------------------------------------

## 14. Demo Story

The demo should tell one coherent story rather than showcasing
disconnected features.

### Step 1 --- Explain the Problem

> Traditional ticket systems make customers understand the system
> instead of the system understanding the customer.

### Step 2 --- Create a Ticket

Enter:

> My laptop keeps shutting down since yesterday's update. It happened
> three times this morning and I'm unable to work properly.

AI produces:

``` text
Laptop randomly shutting down after update

Hardware · High impact

Summary:
Laptop started unexpectedly shutting down
following yesterday's system update.
```

The user reviews it and clicks:

**Create request**

### Step 3 --- Understand an Existing Ticket

Open a ticket containing a long conversation.

Instead of reading every comment:

``` text
✨ What's happening?

Your replacement was approved and
a new laptop has been ordered.

Waiting on: IT

Action required from you: None
```

### Step 4 --- Show Important Changes

Open another ticket:

``` text
✨ Since your last visit

Support needs your laptop serial number.
```

### Step 5 --- AI-Assisted Reply

Click:

**Help me reply**

AI prepares a response.

The customer reviews it and sends the comment through the provided API.

### Final Message

> **Stop managing tickets. Just tell us what happened.**

------------------------------------------------------------------------

## 15. Technical Quality Checklist

Because this is a Vue hackathon, the implementation should also
demonstrate solid frontend engineering.

-   Vue 3 Composition API
-   TypeScript
-   Small reusable components
-   Typed ticket/API models
-   Ticket API isolated in a service
-   AI API isolated in a service
-   Reusable composables
-   Clear loading states
-   Clear error states
-   Empty states
-   Responsive UI
-   No giant all-in-one components
-   Human confirmation before important AI actions

------------------------------------------------------------------------

## 16. MVP Definition

The MVP is complete when a user can:

1.  View their tickets.
2.  Open a ticket and understand its status.
3.  Describe a new issue in natural language.
4.  Have AI structure that issue into a ticket.
5.  Review and create the ticket through the Mock Ticketing API.
6.  Open a ticket with a long history and receive an AI summary.

Everything after this is an enhancement.

### Stretch Features

If the MVP is stable:

-   Important-change detection
-   Recommended next action
-   AI-assisted replies
-   Attachment/screenshot analysis, if supported
-   Voice input
-   Natural-language ticket search
-   Ticket trend/issue summaries
