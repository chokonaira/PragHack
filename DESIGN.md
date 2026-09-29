# Design rules

One source of truth for how TicketFlow AI looks and moves. Build on Nuxt UI 4 and Tailwind 4 semantic tokens. If a rule here is missing or wrong, change this file in the same push as the code, and add a line to the sync log in `TICKETS.md`. Wireframes: [docs/WIREFRAMES.md](docs/WIREFRAMES.md).

## Principles

1. **Clear over clever.** A customer should know what to do in three seconds.
2. **AI is visible and optional.** AI content looks different, is labelled, is editable, and never blocks the core flow.
3. **Calm and fast.** Few colours, generous space, short motion.
4. **Accessible by default.** Keyboard, contrast, reduced motion, and no meaning carried by colour alone.

## Signature: the flow line

TicketFlow feels like tracking a parcel. Every ticket is a **route with three stops**: Received, In progress, Resolved. The `TicketFlowTracker` component draws it and is reused everywhere:

- **Ticket rows:** a compact line under the summary.
- **Ticket header:** a large line with timestamps.
- **Creator:** the new ticket joins the line at stop one when it is created.
- **Logo:** the same line with three nodes.

Done stops are filled cobalt, the current stop has a soft pulse ring (off under reduced motion), upcoming stops are outlined. This is the one memorable element. Keep everything else quiet.

Layout rule: ticket lists are **divided rows**, not grids of identical cards. Cards are for AI content and forms.

## Colour

Use the Nuxt UI colour aliases. Set them once in `app/app.config.ts`:

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'cobalt',
      secondary: 'violet',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'slate'
    }
  }
})
```

Replace the starter's green scale in `app/assets/css/main.css` with the `cobalt` scale (50 `#EEF3FF`, 100 `#DCE6FF`, 200 `#BCCEFF`, 300 `#8FADFF`, 400 `#5B84FF`, 500 `#3562FF`, 600 `#1F4BF0`, 700 `#1A3BC4`, 800 `#1B349C`, 900 `#1C317B`, 950 `#131F4D`).

| Role | Alias | Used for |
|---|---|---|
| Brand and actions | `primary` (cobalt, custom scale) | Primary button, links, focus, selected states |
| **AI only** | `secondary` (violet) | Anything AI produced: `AiCard`, AI badge, sparkles icon. Never used for anything else |
| Success | `success` (green) | Resolved, saved, created |
| Info | `info` (sky) | New status |
| Warning | `warning` (amber) | In progress, medium impact, missing info |
| Error | `error` (red) | Failures, high impact |
| Surfaces and text | `neutral` (slate) | Everything else |

Rules:

- Use semantic classes: `bg-default`, `bg-muted`, `bg-elevated`, `text-highlighted`, `text-default`, `text-muted`, `border-default`, and colour aliases like `text-primary`, `bg-secondary/10`. **No hex values, no raw `slate-500`-style classes in components.**
- No gradients, glows or drop shadows for decoration. Cards use a 1px border.
- Text contrast at least 4.5:1, UI boundaries and icons at least 3:1, in both themes. Check in T-21.

## Themes

Light and dark, both first-class. Default follows the system. The header has a colour-mode toggle (`UColorModeButton`). Every screen is reviewed in both before it is done.

## Typography

Font: **Schibsted Grotesk** (variable, weights 400 to 700) for everything, set as `--font-sans` in `main.css` (Nuxt loads it automatically). Display headings use weight 600 to 700 with tight tracking. Ticket keys such as `MCDTE-48` use `font-mono`. Numbers and dates use `tabular-nums`. No other fonts.

| Use | Classes | Notes |
|---|---|---|
| Page title | `text-3xl font-semibold tracking-tight` | One per page |
| Section title | `text-xl font-semibold` | |
| Card title | `text-lg font-medium` | |
| Body | `text-base leading-relaxed` | 16 px minimum for body |
| Secondary text | `text-sm text-muted` | |
| Caption and footnote | `text-xs text-muted` | 12 px is the smallest size |

Weights: 400, 500, 600 only. Prose such as AI summaries stays under 65 characters per line (`max-w-prose`).

## Space, layout and shape

- 4 px scale. Page container `max-w-5xl mx-auto px-4 sm:px-6`. Section gap `gap-6`. Card padding `p-4 sm:p-5`. List gap `gap-3`.
- Corner radius: set `--ui-radius: 0.5rem` in `main.css` and use component defaults.
- Mobile first. Single column below `lg`. Ticket detail becomes two columns (timeline and details) from `lg` up.
- Touch targets at least 44 px on mobile. Minimum supported width 390 px.

## Status and impact

Never colour alone: always icon plus text.

| Value | Colour | Icon (lucide) |
|---|---|---|
| New | `info` | `i-lucide-circle-dot` |
| In progress | `warning` | `i-lucide-loader` |
| Resolved | `success` | `i-lucide-circle-check` |
| Low impact | `neutral` | `i-lucide-arrow-down` |
| Medium impact | `warning` | `i-lucide-minus` |
| High impact | `error` | `i-lucide-triangle-alert` |

Show status with `UBadge variant="subtle"`. Impact is an AI estimate, so it appears inside AI content only.

## AI visual language

All AI-produced content lives in `AiCard`:

- Container: `rounded-lg border border-secondary/30 bg-secondary/5 p-4`.
- Header: `i-lucide-sparkles` icon, the title, and a `UBadge color="secondary" variant="subtle"` reading "AI".
- Footnote (`text-xs text-muted`): "AI-generated. Check before you rely on it." plus what it is based on, for example "Based on 8 comments".
- States: **loading** (skeleton lines, `aria-busy`), **error** (one short sentence and a "Try again" button, never a raw error), **ready**.
- Anything the AI fills into a form is editable. Fields the user changed show a small "Edited" marker.
- After the user confirms, saved content looks like normal content. Only pending AI content is violet.
- If AI fails, the core flow still works and the message says what to do ("Fill it in manually").

## Motion

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 150 ms | Hover, press, toggles |
| `--motion-base` | 250 ms | Enter and exit of cards, toasts |
| `--motion-slow` | 400 ms | AI result reveal, page changes |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Default easing |

Add to `main.css`:

```css
:root {
  --ui-radius: 0.5rem;
  --motion-fast: 150ms;
  --motion-base: 250ms;
  --motion-slow: 400ms;
  --ease-out: cubic-bezier(.2, .8, .2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-base: 0ms;
    --motion-slow: 0ms;
  }
}
```

Rules: animate only `transform` and `opacity`. Nothing longer than 400 ms. Nothing loops except skeleton pulse and the AI progress indicator. Under reduced motion there is no movement, only instant changes.

## Components

Use Nuxt UI components first and check the docs for the installed version before building custom ones.

- One primary button per view. Icon-only buttons need an `aria-label`.
- Forms: `UFormField` with label, optional help text and inline error. Never rely on placeholder as label.
- Feedback after actions: `useToast`. Errors that need action stay inline.
- Loading: `USkeleton` shaped like the final content. Never a blank screen or a lone spinner.
- Empty state: icon, one-line headline naming the space, one line of help, one button.
- Error state: `UAlert` with what happened, what to do, and a retry button. Never raw error text or stack traces.

## Copy

- Sentence case everywhere. Buttons start with a verb: "Create request", "Try again".
- No "successfully", no "please", no exclamation marks on system text.
- Errors say what happened and what to do next, in one sentence.
- Address the customer as "you" and "your requests".
- Labels and headings have no trailing full stop. Help text and descriptions do.

## Accessibility

- Visible focus on every interactive element. Never remove the outline.
- Everything reachable and operable by keyboard, in a logical order. Skip-to-content link in the header.
- Every input has a label. Icons that carry meaning have text or `aria-label`.
- AI regions use `aria-live="polite"` and `aria-busy` while loading.
- Status and impact never rely on colour alone.
- `prefers-reduced-motion` respected.
- axe: no serious or critical issues on home, detail and creator (ticket T-21).

## Design review checklist (every UI change)

- [ ] Only semantic tokens, no hex colours.
- [ ] Reviewed at 390 px and 1440 px, light and dark.
- [ ] Keyboard only works, focus visible.
- [ ] Loading, empty and error states present.
- [ ] AI content in `AiCard`, labelled, editable, with a fallback.
- [ ] Copy follows the copy rules.
- [ ] Motion uses the tokens and respects reduced motion.
