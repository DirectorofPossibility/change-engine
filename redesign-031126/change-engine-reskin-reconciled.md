# Change Engine — Reskin Prompt (Reconciled)
## Based on actual project audit · Next.js 14 + Supabase + Tailwind 3.4

---

## YOUR ROLE

You are reskinning the frontend of Change Engine. The database, data layer,
auth, routing, and API routes are locked. You are replacing the component
layer and visual design only.

Read `project-audit.md` before touching any file.
Read `change-engine-page-system.html` — this is the visual target.
Read `change-engine-claude-code-prompt.md` — this is the design system spec.

---

## WHAT IS LOCKED — DO NOT TOUCH

```
src/lib/data/**          — all data-fetching functions
src/lib/supabase/**      — database connection and generated types
src/lib/types/**         — type definitions
src/lib/contexts/**      — LanguageContext, NeighborhoodContext
src/app/api/**           — API routes
src/middleware.ts        — auth and route protection
supabase/**              — migrations, edge functions
```

Page-level data fetching in `page.tsx` files stays exactly as-is.
Only the JSX return block changes.

---

## ROUTING RULES — NON-NEGOTIABLE

- Every `href` must point to an existing `page.tsx`
- Use `content_published.id` (UUID) for content routes: `/content/{id}`
- Never use `inbox_id` for routing — translation lookup only
- ContentCard `href` prop handles explicit routing overrides

---

## STEP 1 — DESIGN TOKENS

Replace `tailwind.config.ts` completely. This is the foundation.
Do this before touching any component.

### Fonts

Load via `next/font/google` in `src/app/layout.tsx`:

```typescript
import { Fraunces, Libre_Baskerville, DM_Mono } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  axes: [{ tag: 'opsz', value: 144 }],
  variable: '--font-display',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
})
```

Remove all references to DM Serif Display, DM Sans, Caveat. They are gone.

Apply in `tailwind.config.ts`:

```javascript
fontFamily: {
  display: ['var(--font-display)', 'Georgia', 'serif'],
  body:    ['var(--font-body)', 'Georgia', 'serif'],
  mono:    ['var(--font-mono)', 'monospace'],
}
```

Set in `globals.css`:

```css
body        { font-family: var(--font-body); }
h1, h2, h3  { font-family: var(--font-display); }
*           { border-radius: 0 !important; }
```

The `border-radius: 0 !important` global override catches anything that
slips through. Sharp corners everywhere, no exceptions.

### Color Tokens

Replace existing color config with:

```javascript
colors: {
  ink:        '#0d1117',
  paper:      '#f4f5f7',
  white:      '#ffffff',
  dim:        '#5c6474',
  faint:      '#8a929e',
  rule:       '#dde1e8',
  blue:       '#1b5e8a',
  'blue-lt':  '#2a7db5',
  'blue-bg':  '#e8f2fa',
  teal:       '#7ec8e3',
  civic:      '#b03a2a',
  // Pathway colors (keep existing pathway IDs, update hex values)
  health:     '#1a6b56',   // was #e53e3e
  'health-lt':'#e4f2ed',
  'health-dk':'#0a2a22',
  families:   '#1e4d7a',   // was #dd6b20
  hood:       '#4a2870',   // was #d69e2e
  voice:      '#7a2018',   // was #38a169
  money:      '#6a4e10',   // was #3182ce
  planet:     '#1a5030',   // was #319795
  bigger:     '#1a3460',   // was #805ad5
  // Center colors — keep these, they are used for badges
  learning:   '#2563eb',
  action:     '#dc2626',
  resource:   '#16a34a',
  accountability: '#9333ea',
}
```

Note: pathway hex values are changing from the existing warm/bright palette
to the editorial dark palette from the design system. The THEME_01–THEME_07
IDs and logic remain unchanged — only the colors update.

---

## STEP 2 — GEO COMPONENT LIBRARY (MERGE)

The existing FOL components stay. Add our geo library alongside them.

### Keep as-is:
```
src/components/geo/FlowerIcons.tsx
src/components/geo/FOLElements.tsx
src/components/geo/GradientFOL.tsx
src/components/geo/FOLWatermark.tsx
src/components/geo/FOLLoading.tsx
src/components/geo/HeroFOLBackground.tsx
```

### Add new file:
Place `geo-components.tsx` at `src/components/geo/sacred.tsx`.
Do not rename or modify its contents.

### Create a unified index:

```typescript
// src/components/geo/index.ts

// Flower of Life family (existing)
export { FlowerIcons }      from './FlowerIcons'
export { FOLElements }      from './FOLElements'
export { GradientFOL }      from './GradientFOL'
export { FOLWatermark }     from './FOLWatermark'
export { FOLLoading }       from './FOLLoading'
export { HeroFOLBackground } from './HeroFOLBackground'

// Sacred geometry library (new)
export {
  Geo,
  GEO_MAP,
  VesicaPiscis,
  FlowerOfLife,
  CompassRose,
  NestedCircles,
  OutwardSpiral,
  HubAndSpokes,
  SixPetalRose,
  Torus,
  SeedOfLife,
  HexGrid,
  ConcentricRings,
  GoldenSpiral,
  MetatronCube,
} from './sacred'
```

### Pathway → FOL color mapping

The existing FOL components use pathway colors. Update their color props
to match the new palette. Use `HeroFOLBackground` on pathway hero sections
with the pathway's updated color.

---

## STEP 3 — NAVIGATION AND WAYFINDER

### Delete these legacy files (no longer imported per audit):
```
src/components/layout/Header.tsx
src/components/layout/Footer.tsx
src/components/layout/LeftNav.tsx
src/components/layout/MobileBottomNav.tsx
```

### Replace in `src/app/(exchange)/layout.tsx`:

Keep: `D2Nav`, `TranslateBar`, `D2Footer`, `TickerTape`,
`OnboardingLoader`, `ChanceChatWidget`

Replace the visual implementation of `D2Nav` and `D2Footer` to match
the design spec in `change-engine-claude-code-prompt.md` under
NAVIGATION, while preserving:
- All i18n hooks (`useLanguage`, `useTranslation`)
- `NeighborhoodContext` — do not remove the ZIP-based context
- Auth state display
- Mobile bottom nav behavior

Add `Wayfinder` component from `change-engine-claude-code-prompt.md`
below the main nav. It reads the current route to build breadcrumbs.

---

## STEP 4 — GLOBAL STYLES

In `src/app/globals.css`:

```css
/* Typography */
body {
  font-family: var(--font-body);
  color: #0d1117;
  background: #ffffff;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
}

/* Sharp corners everywhere */
*, *::before, *::after {
  border-radius: 0 !important;
}

/* Exception: only circular elements */
.rounded-full { border-radius: 9999px !important; }

/* DM Mono for all labels */
.label, .tag, .kicker, .meta, .badge {
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Remove cream background */
/* Old: background: #FAF8F5 */
/* New: background: #ffffff with paper (#f4f5f7) for section fills */
```

---

## STEP 5 — PAGE RESKINS

Work through pages in this order. For each page:
1. Read the current `page.tsx` — understand what data is fetched
2. Read the data type from `src/lib/types/`
3. Replace only the JSX return block
4. Keep all data-fetching calls identical
5. Preserve all i18n hooks in components
6. Confirm real data loads before moving on

### Page order:

**5a — Homepage** `src/app/(exchange)/(pages)/page.tsx`

Match the Theme Hub masthead style from `change-engine-page-system.html`.

ALSO close GAP 1 and GAP 2 here (see Step 6):
- Add promotion slot above the fold using `getFeaturedContent()`
- Add rotating quote using `getRandomQuote()`

**5b — Pathway pages** `src/app/(exchange)/(pages)/pathways/[slug]/page.tsx`

- `HeroFOLBackground` in masthead with pathway color
- Control panel grid of focus areas (Instrument component spec from
  `change-engine-claude-code-prompt.md`)
- Add pathway-specific quotes as section breaks (GAP 2)
- Add pathway promotion slot (GAP 1)
- Use `getPathwayBraidedFeed(themeId)` to populate content feed (GAP 5)

**5c — Service detail** `src/app/(exchange)/(pages)/services/[id]/page.tsx`

- Match Resource Page template (PAGE TYPE 3 in build prompt)
- Add related services section using `getRelatedServices(focusAreaIds)` (GAP 3)
- Add contextual quote matching `pathway_primary` (GAP 2)
- Add contextual promotion (GAP 1)

**5d — Official profile** `src/app/(exchange)/(pages)/officials/[id]/page.tsx`

- Official photo, title, jurisdiction in masthead
- Add related officials using `getRelatedOfficials(focusAreaIds)` (GAP 3)
- Level 5 civic red border treatment — this is a Deep Journey resource
- Active legislation gets red left border (civic color)

**5e — Policy detail** `src/app/(exchange)/(pages)/policies/[id]/page.tsx`

- Active policies: red left border, `civic` color treatment
- Add related policies using `getRelatedPolicies(focusAreaIds)` (GAP 3)
- Add contextual quote (GAP 2)

**5f — Organization detail** `src/app/(exchange)/(pages)/organizations/[id]/page.tsx`

- Match Resource Page template
- Add related orgs using `getRelatedOrgsForGuide(focusAreaIds)` (GAP 3)

**5g — Content detail** `src/app/(exchange)/(pages)/content/[id]/page.tsx`

- Use `title_6th_grade` and `summary_6th_grade` fields for display text
- Add related content using `getRelatedContentForGuide(focusAreaIds)` (GAP 3)

**5h — Remaining pages**

Browse/listing pages, search, user dashboard — apply design tokens,
font switch, and sharp corners. These don't need the full editorial
treatment but must match the color and type system.

---

## STEP 6 — CLOSE THE GAPS

These are backend features that were never wired to the UI.
Close them as you reskin each page (not as a separate pass).

### GAP 1 — Promotions (REQUIRED)

Add promotion placements on:
- Homepage: above-fold banner
- Pathway pages: featured promo slot
- Browse pages: sidebar promo
- Detail pages: contextual promo matching `pathway_primary`

```typescript
// Already exists in lib/data/homepage.ts
const promotions = await getActivePromotions(pathwayId?, limit?)

// Promotion shape:
{
  promo_id, title, subtitle, description,
  promo_type, image_url, cta_text, cta_href,
  color, start_date, end_date, is_active, display_order
}
```

### GAP 2 — Quotes (REQUIRED)

Add quote placements on:
- Detail pages: contextual quote matching `pathway_primary`
- Pathway pages: pathway-specific quotes as section breaks
- Homepage: rotating featured quote

```typescript
// Already exists in lib/data/homepage.ts
const quote = await getRandomQuote(pathwayId?)
const quotes = await getQuotes(pathwayId?, limit?)

// Quote shape:
{ quote_id, quote_text, attribution, pathway_id, is_active }
```

Render quotes in Libre Baskerville italic, large (1.15rem+),
with a 3px left border in the pathway color.
Attribution in DM Mono uppercase.

### GAP 3 — Related Items on Detail Pages (REQUIRED)

On every detail page, after the main body:

```typescript
// Grab focus_area_ids from the entity, then:
const relatedServices  = await getRelatedServices(entity.focus_area_ids)
const relatedOfficials = await getRelatedOfficials(entity.focus_area_ids)
const relatedPolicies  = await getRelatedPolicies(entity.focus_area_ids)
// etc — use whichever are relevant to the page type
```

Render as a 3-column card grid using the same card component as browse pages.
Section header: DM Mono kicker + Fraunces heading.

### GAP 4 — Neighborhood Personalization (RECOMMENDED)

`NeighborhoodContext` already stores ZIP. Wire it up on browse pages:

```typescript
const { neighborhoodId } = useNeighborhoodContext()
if (neighborhoodId) {
  const local = await getContentForNeighborhood(neighborhoodId)
}
```

Show a "Near you" section when ZIP is set. Show a "Set your neighborhood"
prompt when it isn't. The entire backend is ready — this is UI only.

### GAP 5 — Pathway Drill-Down (RECOMMENDED)

On pathway pages, use braided feed for richer content:

```typescript
const feed = await getPathwayBraidedFeed(themeId)
const byCenter = await getCenterContentForPathway(themeId)
```

Organize content by Center (Learning / Action / Resource / Accountability)
using the existing center badge colors and the travel guide level names
from the design spec.

### GAP 7 — Error Boundaries (REQUIRED)

Add `error.tsx` to these routes that are missing them:
```
src/app/(exchange)/(pages)/adventures/[slug]/error.tsx
src/app/(exchange)/(pages)/benefits/[id]/error.tsx
src/app/(exchange)/(pages)/campaigns/[id]/error.tsx
src/app/(exchange)/(pages)/learning-paths/[id]/error.tsx
src/app/(exchange)/(pages)/collections/[id]/error.tsx
src/app/(exchange)/(pages)/agencies/[id]/error.tsx
src/app/(exchange)/(pages)/help/[slug]/error.tsx
src/app/(exchange)/(pages)/elections/[id]/error.tsx
```

Standard error boundary — show a message in the design system style,
link back to the parent pathway page.

---

## STEP 7 — I18N PRESERVATION

Every component that renders user-facing text must preserve i18n hooks.
Do not hardcode English strings where translations exist.

Pattern to follow:
```typescript
// Keep this pattern wherever it already exists
const { t } = useLanguage()
// <p>{t('key')}</p>  not  <p>English string</p>
```

When adding new UI copy for gaps (promotions, quotes, related items),
add the English strings to `src/lib/i18n.ts` under a new namespace
(`promotions`, `quotes`, `related`) so they can be translated later.

---

## STEP 8 — DESIGN CONSTRAINTS CHECKLIST

Run this check after completing each page before moving on:

```
NEVER: border-radius on cards, panels, buttons (global override handles it,
       but verify nothing is fighting it with inline styles)
NEVER: emojis — use Geo components from src/components/geo/sacred.tsx
NEVER: DM Sans, DM Serif Display, Caveat, system-ui, or any sans-serif body
NEVER: bullet point lists in body copy — prose or bordered service lists only
NEVER: box-shadow as primary depth signal — use borders
NEVER: center-aligned body copy (only hero stats and pull quotes)
NEVER: warm cream (#FAF8F5) backgrounds — use white or paper (#f4f5f7)

ALWAYS: Fraunces for all headlines and display text
ALWAYS: Libre Baskerville for all body copy
ALWAYS: DM Mono uppercase + letter-spacing 0.08em for labels, tags, metadata
ALWAYS: 2px solid ink (#0d1117) for structural borders
ALWAYS: 1.5px solid rule (#dde1e8) for card and section borders
ALWAYS: title_6th_grade and summary_6th_grade fields for display text
ALWAYS: pathway color coding on every entity
ALWAYS: center badges preserved (Learning/Action/Resource/Accountability)
ALWAYS: Leaflet map components wrapped in dynamic import with ssr: false
```

---

## REFERENCE FILES IN PROJECT ROOT

- `change-engine-page-system.html` — visual target, all three page types
- `change-engine-claude-code-prompt.md` — full design system spec
- `geo-components.tsx` → copy to `src/components/geo/sacred.tsx`
- `project-audit.md` — complete inventory of what exists

When in doubt about any visual decision: match `change-engine-page-system.html`.
When in doubt about any data decision: read the existing `page.tsx` and
the corresponding type in `src/lib/types/`.
