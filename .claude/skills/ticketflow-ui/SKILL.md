---
name: ticketflow-ui
description: Use for ANY UI work in this repo (pages, components, layout, styling, motion, copy). Applies our design system from DESIGN.md and the frontend-design method so the UI is sleek, intuitive, smooth and distinctive, not templated.
---

# TicketFlow UI

Read `DESIGN.md` before touching UI, and follow it. If the `frontend-design` skill is installed, invoke it as well and apply its method on top of this one. Everything below is mandatory for every UI change by every teammate and every AI agent.

## The point of the design

TicketFlow AI feels like tracking a parcel, not filing a form. A ticket is a **route with stops**. The one memorable thing is the **flow line** (`TicketFlowTracker`): it appears in ticket rows, the ticket header, the creator, and the logo. Spend boldness there. Keep everything else quiet and disciplined.

## Process (every UI change)

1. **Plan in 5 lines:** which tokens (colour, type), what layout, which single moment of motion, what states (loading, empty, error, AI failed).
2. **Check the plan against the defaults.** If it looks like any generic SaaS page (identical rounded cards, gradient hero, eyebrow labels, middle-dot meta strings, arrows on every link), change it.
3. **Build with tokens only.** Semantic Nuxt UI classes, the `cobalt` primary, Schibsted Grotesk, motion tokens from `main.css`.
4. **Look at it.** Take screenshots at 390 px and 1440 px, light and dark, before saying it is done. Fix what looks off.
5. **Remove one accessory.** Cut a decoration that does not carry information.

## Rules that keep it sleek

- Lists are **divided rows**, not grids of identical cards. Cards are for AI content and forms.
- One primary button per view. Left-aligned text, generous space, lines under 65 characters.
- Type carries the personality: tight display headings, calm body. No all-caps labels, no eyebrow above every heading, no single accented word in a headline.
- Borders and dividers must encode structure. No decorative shadows or gradients.
- Status is always icon plus text plus colour, and shown on the flow line, never colour alone.
- AI content lives in `AiCard`, a plain quiet card. No sparkle icons, no "AI" pills, no coloured AI boxes, no example chips. Honesty is one small plain-text line. Everything is editable, with a fallback, and never blocks the core flow.

## Rules that keep it smooth and intuitive

- Motion answers an action (opening, saving, moving to the next step). One orchestrated moment per screen at most. No entrance fade-and-slide on every section.
- Use motion tokens (`--motion-fast`, `--motion-base`, `--motion-slow`, `--ease-out`), animate only `transform` and `opacity`, and switch to instant under `prefers-reduced-motion`.
- Every async thing has a skeleton shaped like the result, then an inline error with "Try again". No blank screens, no lone spinners.
- Copy is plain, verb-first, sentence case. Errors say what happened and what to do. Empty states invite an action.
- Keyboard first: visible focus, logical order, shortcuts documented where they exist.

## Quality floor

Responsive down to 390 px, keyboard operable, contrast 4.5:1 in both themes, reduced motion respected, no hex colours, no console errors. Run `pnpm lint`, `pnpm typecheck` and `pnpm test` before pushing.
