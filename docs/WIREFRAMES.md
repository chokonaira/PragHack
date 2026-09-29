# Wireframes (low fidelity)

Three key screens. Layout and content only, styling comes from [DESIGN.md](../DESIGN.md). `[AI]` marks AI-produced content in an `AiCard`. Data comes from the live mock or demo data, so titles and locations are examples.

## 1. Home: my requests

```
┌────────────────────────────────────────────────────────────────┐
│ TicketFlow AI        My requests   New request        [☾] [Demo]│  header (Demo badge only in demo mode)
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  What's the problem?                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Describe it in your own words…                           │ │  entry to the AI creator
│  └──────────────────────────────────────────────────────────┘ │
│                                        [ Create with AI ]      │
│                                                                │
│  My requests                                                   │
│  [All 6] [New 2] [In progress 3] [Resolved 1]    🔍 Search…    │  filter chips with counts + search
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ MCDTE-48   Point of sale terminal is offline             │ │
│  │ ◔ In progress · Prague Nusle · updated 2 h ago           │ │  TicketCard: key, summary,
│  └──────────────────────────────────────────────────────────┘ │  status (icon + text), location, updated
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ MCDTE-49   Request a new kiosk account                   │ │
│  │ ● New · Brno Centrum · updated yesterday                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

States: loading = skeleton cards. Empty = "No requests match" + "New request" button. Error = alert + "Try again". Mobile (390 px): single column, chips scroll horizontally, search moves under the chips.

## 2. AI ticket creator

Step 1, describe:

```
┌──────────────────────────────────────────────┐
│ New request                                  │
│                                              │
│ What happened?                               │
│ ┌──────────────────────────────────────────┐ │
│ │ My laptop keeps shutting down since      │ │
│ │ yesterday's update…                      │ │
│ └──────────────────────────────────────────┘ │
│ Try: [Laptop shuts down] [Can't log in] [Printer offline]
│                                              │
│                  [ Create with AI ]  Ctrl+↵  │
│ Prefer a form? Fill it in manually           │
└──────────────────────────────────────────────┘
```

Step 2, AI working (respects reduced motion):

```
  ✦ Understanding what happened…   ✓
  ✦ Structuring the request…       ●●●
  ○ Choosing the location
```

Step 3, review and confirm:

```
┌──────────────────────────────────────────────┐
│ ✦ Review your request              [AI]      │
│                                              │
│ Title                                        │
│ [ Laptop randomly shutting down after update]│
│ Description                                  │
│ [ Laptop started shutting down after…      ] │
│ Type            Location                     │
│ [Incident ▾]    [Prague Nusle ▾]             │
│ Impact: High                                 │
│ ⚠ Missing info: laptop serial number         │
│                                              │
│ AI-generated. Check before you rely on it.   │
│                                              │
│      [ Back ]        [ Create request ]      │  nothing is created until this click
└──────────────────────────────────────────────┘
```

If AI fails: step 3 shows the same form empty with "Fill it in manually". Fields the user changed show an "Edited" marker.

## 3. Ticket detail

```
┌────────────────────────────────────────────────────────────────┐
│ ← My requests                                                  │
│ MCDTE-48                                     ◔ In progress     │
│ Point of sale terminal is offline                              │
│ Incident · Prague Nusle · created 17 Sep · updated 2 h ago     │
├───────────────────────────────────────┬────────────────────────┤
│ ┌───────────────────────────────────┐ │ Details                │
│ │ ✦ What's happening?        [AI]   │ │ Reporter: Mock User    │
│ │ Your replacement was approved and │ │ Assignee: Support Team │
│ │ a new terminal has been ordered.  │ │ Location: Prague Nusle │
│ │ Waiting on: Support               │ │                        │
│ │ Action needed from you: None      │ │ Attachments: none      │
│ │ Based on 8 comments · [Refresh]   │ │                        │
│ └───────────────────────────────────┘ │                        │
│                                       │                        │
│ Description                           │                        │
│ POS-01 is not accepting card payments.│                        │
│                                       │                        │
│ Timeline                              │                        │
│ ● 17 Sep 08:30  Ticket created        │                        │
│ ● 17 Sep 09:10  Support: Please send… │                        │
│ ● 18 Sep 08:45  You: Serial is…       │                        │
└───────────────────────────────────────┴────────────────────────┘
```

Below `lg` the right column moves under the timeline. Loading = skeleton for header, AI card and timeline. The AI card can fail on its own ("Couldn't summarize this. Try again.") and the rest of the page keeps working. P1 adds a "Since your last visit" AI card above the summary and a comment composer with "Help me reply" below the timeline.
