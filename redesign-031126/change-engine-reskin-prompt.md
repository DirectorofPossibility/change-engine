# Change Engine — Reskin Prompt
## For use with an existing Next.js + Supabase project

Drop this file in your project root alongside:
- `change-engine-page-system.html`
- `change-engine-claude-code-prompt.md`
- `components/geo/index.tsx`

---

## CONTEXT

This is an existing Next.js + Supabase project with working data connections
and custom styling that needs to be replaced. Do not rebuild from scratch.
Audit what exists, preserve what works, replace only the design layer.

---

## STEP 1 — AUDIT (do this before touching anything)

Read the project structure and report back on:

1. **Pages** — list every file in `app/` and what route it serves
2. **Components** — list every file in `components/` and what it does
3. **Styling** — how is styling currently applied? (Tailwind classes, CSS modules,
   inline styles, a mix?) Is there a design system or just ad-hoc classes?
4. **Data layer** — how does Supabase connect? Where are the query functions?
   What tables are being queried?
5. **Fonts** — what fonts are currently loaded?
6. **`tailwind.config.ts`** — what custom tokens exist, if any?

Do not edit any files yet. Give me the audit report first.

---

## STEP 2 — AFTER I CONFIRM, RESKIN IN THIS ORDER

### 2a — Design tokens first

Replace `tailwind.config.ts` completely with the token system from
`change-engine-claude-code-prompt.md`. This is the foundation everything
else depends on. Do this before touching any component.

Fonts to load via `next/font/google` in `app/layout.tsx`:
- Fraunces (display, weight 700 + 900, optical size axis)
- Libre Baskerville (body, weight 400 + 700)
- DM Mono (mono, weight 400)

Apply as CSS variables: `--font-display`, `--font-body`, `--font-mono`.

### 2b — Global styles

In `app/globals.css`:
- Set `font-family: var(--font-body)` on `body`
- Set `font-family: var(--font-display)` on `h1, h2, h3`
- Set `border-radius: 0` globally (override any Tailwind defaults)
- Remove any existing color or spacing overrides that conflict with the new tokens

### 2c — Geo components

The sacred geometry SVG library is already written.
Place `geo-components.tsx` at `components/geo/index.tsx` exactly as written.
Do not modify it. Do not rewrite any SVGs.

### 2d — Wayfinder

Replace or create `components/layout/Wayfinder.tsx` using the spec in
`change-engine-claude-code-prompt.md` under WAYFINDER COMPONENT.

If a Wayfinder already exists, replace it entirely — do not try to patch
the existing one.

### 2e — Site nav

Replace or create `components/layout/SiteNav.tsx`.
Use the SeedOfLife geo component as the brand mark.
DM Mono uppercase for all nav links. Sharp corners on any dropdowns or panels.

### 2f — Page reskins (one at a time, in this order)

For each page, preserve the Supabase data fetching logic exactly as it is.
Replace only the JSX structure and styling to match the design spec.

**Page order:**
1. Theme Hub — `app/[region]/page.tsx`
   Reference: PAGE TYPE 1 in `change-engine-claude-code-prompt.md`
   Visual reference: "Theme Hub: Health" in `change-engine-page-system.html`

2. Focus Area Hub — `app/[region]/[destination]/page.tsx`
   Reference: PAGE TYPE 2
   Visual reference: "Focus Area: Mental Health"

3. Resource Page — `app/[region]/[destination]/[resource]/page.tsx`
   Reference: PAGE TYPE 3
   Visual reference: "Resource: The Harris Center"

4. Home / index page — `app/page.tsx`
   Theme grid linking to each region. Same Instrument component style as
   control panel but larger.

For each page reskin, confirm the page still loads real data from Supabase
before moving to the next one.

---

## DESIGN RULES — APPLY TO EVERY FILE YOU TOUCH

These are non-negotiable. Check every component before marking it done.

```
NEVER: border-radius on cards, panels, buttons, or containers
NEVER: emojis — use Geo components instead
NEVER: Inter, Roboto, system-ui, or any sans-serif for body copy
NEVER: bullet point lists in body copy — prose or bordered service lists only
NEVER: "Our Health", "Our Families" in slugs or nav — use "health", "families"
NEVER: card box-shadows as primary depth — use borders
NEVER: center-aligned body copy (except hero stats and pull quotes)

ALWAYS: Fraunces for headlines and display text
ALWAYS: Libre Baskerville for body copy
ALWAYS: DM Mono uppercase + letter-spacing for all labels, tags, metadata, CTAs
ALWAYS: 2px solid ink (#0d1117) for structural borders
ALWAYS: 1.5px solid rule (#dde1e8) for card and section borders
ALWAYS: sharp corners everywhere
```

---

## WHAT NOT TO TOUCH

- Any file in `lib/supabase/` — the data layer stays as-is
- Any `.env.local` or environment config
- Any existing Supabase query logic inside page files — wrap it, don't replace it
- `public/` directory
- Any API routes in `app/api/`

---

## DRIFT CHECK

After completing each section, run this check before moving on:

```
Review what you just built against the design constraints above.
Check for: border-radius, wrong fonts, emojis, bullet lists in body copy,
box-shadows as primary depth, sans-serif body text.
Fix anything that drifted before proceeding.
```

---

## REFERENCE FILES

- `change-engine-page-system.html` — the visual target, all three page types
- `change-engine-claude-code-prompt.md` — full design system, component specs,
  color tokens, typography rules, copy voice
- `components/geo/index.tsx` — sacred geometry SVG library, do not rewrite

When in doubt about any visual decision: match `change-engine-page-system.html` exactly.
