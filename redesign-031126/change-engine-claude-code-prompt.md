# Change Engine — Claude Code Build Prompt
## Community Exchange · changeengine.us · Next.js + Supabase + Vercel

---

## WHAT YOU ARE BUILDING

A civic discovery platform for Houston. Think: a travel guide to community life, not a directory. Three page types, one consistent design system, data from Supabase.

The live reference design is `change-engine-page-system.html`. Every visual decision in that file is intentional and locked. Do not improvise design choices — implement what is there.

---

## TECH STACK

```
Next.js 14          App Router (not Pages Router)
Supabase            Postgres + Row Level Security
Tailwind CSS        Custom config — see design tokens below
TypeScript          Strict mode
Vercel              Deployment target
next/font           Google Fonts (Fraunces, Libre Baskerville, DM Mono)
```

No additional UI component libraries. No shadcn. No Radix. No Chakra. Build from the design system defined here.

---

## DESIGN SYSTEM — NON-NEGOTIABLE RULES

### Typography

```js
// tailwind.config.ts
fontFamily: {
  display: ['Fraunces', 'Georgia', 'serif'],    // Headlines, pull quotes, large numbers
  body:    ['Libre Baskerville', 'Georgia', 'serif'], // Body copy, descriptions
  mono:    ['DM Mono', 'monospace'],            // Labels, tags, metadata, CTAs
}
```

- **Display (Fraunces):** Headlines, pull quotes, destination names, data numbers. Weight 700 or 900. Optical size `9..144`. Italic is expressive — use it intentionally.
- **Body (Libre Baskerville):** All running copy. Editorial feel. Never use for labels or UI.
- **Mono (DM Mono):** ALL labels, tags, kickers, metadata, button text, nav links. Always uppercase, letter-spacing `.08em` minimum.

### Color Tokens

```js
// tailwind.config.ts
colors: {
  ink:       '#0d1117',   // Primary text, borders on key elements
  paper:     '#f4f5f7',   // Section backgrounds, control panel
  white:     '#ffffff',
  dim:       '#5c6474',   // Secondary text
  faint:     '#8a929e',   // Tertiary text, metadata
  rule:      '#dde1e8',   // All borders except key structural borders
  blue:      '#1b5e8a',   // Primary brand, links, active states
  'blue-lt': '#2a7db5',
  'blue-bg': '#e8f2fa',   // Link hover backgrounds
  teal:      '#7ec8e3',   // Accent on dark backgrounds only
  // Theme colors
  health:    '#1a6b56',
  'health-lt':  '#e4f2ed',
  'health-dk':  '#0a2a22',
  families:  '#1e4d7a',
  hood:      '#4a2870',
  voice:     '#7a2018',
  money:     '#6a4e10',
  planet:    '#1a5030',
  bigger:    '#1a3460',
  // Civic alert
  civic:     '#b03a2a',   // Active legislation, urgent items
}
```

### Borders & Corners

```
SHARP CORNERS EVERYWHERE. border-radius: 0 on all cards, panels, buttons.
border-radius is only permitted on: circular dots, SVG elements.

Key structural borders: 2px solid ink (#0d1117)
  - Site nav bottom
  - Chapter/section openers
  - Control panel outer grid

Secondary borders: 1.5px solid rule (#dde1e8)
  - Card grid lines
  - Section dividers
  - Content cells

Tertiary borders: 1px solid rule
  - Inside card content
  - List items
```

### No Emojis. Ever.
Use SVG sacred geometry marks in place of any icon or emoji. The SVG library is defined below.

---

## SACRED GEOMETRY SVG SYSTEM

Every focus area has a unique SVG mark. These are components, not inline SVGs.

```
/components/geo/
  VesicaPiscis.tsx          — Mental Health
  FlowerOfLife.tsx          — Food Access
  CompassRose.tsx           — Healthcare Access
  NestedCircles.tsx         — Maternal Health
  OutwardSpiral.tsx         — Substance Use & Recovery
  HubAndSpokes.tsx          — Disability & Access
  SixPetalRose.tsx          — Oral Health
  Torus.tsx                 — Environmental Health
  SeedOfLife.tsx            — Nav brand mark, Families
  HexGrid.tsx               — Neighborhood
  ConcentricRings.tsx       — Our Voice
  GoldenSpiral.tsx          — Our Money
  PlanetTorus.tsx           — Our Planet
  MetatronCube.tsx          — The Bigger We
```

Each geo component accepts:
```ts
interface GeoProps {
  color?: string       // stroke color, defaults to theme color for that area
  size?: number        // viewBox remains 140x120 or 100x100, scale via width/height
  opacity?: number     // overall opacity
  animated?: boolean   // slow rotation animation (default false, true for backgrounds)
  className?: string
}
```

The `animated` prop adds `animate-spin` with a very slow duration (60s–120s via custom Tailwind animation).

---

## ROUTE ARCHITECTURE

```
app/
  layout.tsx                  — SiteNav (sticky), global fonts
  page.tsx                    — Home / guide index

  [region]/
    page.tsx                  — Theme Hub (e.g. /health)
    [destination]/
      page.tsx                — Focus Area Hub (e.g. /health/mental-health)
      [resource]/
        page.tsx              — Resource Page (e.g. /health/mental-health/harris-center)
```

### URL slugs map to Supabase slugs:
- `/health` → `themes.slug = 'health'`
- `/health/mental-health` → `focus_areas.slug = 'mental-health'`
- `/health/mental-health/harris-center` → `resources.slug = 'harris-center'`

---

## WAYFINDER COMPONENT

Appears on every page type. Dark bar, sticky below site nav.

```tsx
// components/Wayfinder.tsx

interface WayfinderProps {
  crumbs: Array<{ label: string; href?: string; here?: boolean }>
  trailLevel?: number   // 1–5, how many dots are lit
  trailLabel?: string   // "Trail depth" or "You are at"
}
```

**Visual spec:**
- Background: `ink` (#0d1117)
- Left: breadcrumb trail. Each step is DM Mono, .62rem, uppercase, color `rgba(255,255,255,.35)`. Active/current step (`here: true`) is `teal` (#7ec8e3) with a 2px bottom border in teal.
- Separator: `›` in `rgba(255,255,255,.15)`
- Right: trail label (DM Mono, .56rem, rgba white .25) + 5 dots. Lit dots are `teal`. Unlit are `rgba(255,255,255,.15)`.
- On mobile: crumb trail scrolls horizontally (overflow-x: auto, hide scrollbar). Trail dots remain visible.

---

## PAGE TYPE 1: THEME HUB

Route: `app/[region]/page.tsx`

### Data fetch:
```ts
const theme = await supabase
  .from('themes')
  .select(`
    *,
    focus_areas (
      id, slug, name, brief, trail_levels_loaded, has_active_civic,
      geo_type
    ),
    couch_content (
      id, slug, content_type, title, dek, source, duration, is_feature
    )
  `)
  .eq('slug', params.region)
  .single()
```

### Layout sections (in order):

**1. Wayfinder**
`crumbs: [{ label: 'Guide', href: '/' }, { label: theme.name, here: true }]`
`trailLevel: 5` (theme hub has all 5 levels available)

**2. Feature Masthead** (`.theme-mast`)
- Dark gradient background using `health-dk` → `health` (or theme-appropriate colors)
- Two animated geo SVGs as background elements (large FOL behind, smaller seed of life top-right)
- Dateline: `Houston, TX · Region 0{n} · 2026 Edition`
- H1: `The State of [Theme Name] in Houston` — Fraunces 900, clamp(2.4rem, 5vw, 4.2rem)
- H1 second line in italic, color `rgba(255,255,255,.75)` — pull the italic voice word from `theme.hed_em`
- Horizontal rule: 50px, 2px, rgba white .3
- Deck copy: Libre Baskerville italic, from `theme.deck`
- Stats row: 3 stats from `theme.stats` (num + descriptor). Stats box has 1px rgba white .12 border.

**3. Feature Opener** (2-column grid, drops to 1 col mobile)
- Left: editorial body copy with drop cap (Fraunces, 3.5rem, theme color, floated left). Text from `theme.feature_lede`.
- Right: 2 pull quotes with left border (3px solid theme color). From `theme.pull_quotes`.

**4. Data Stories** (3-column grid, 1 col mobile)
Each story: large number (Fraunces 900, 2.8rem, theme color), headline, italic body copy. From `theme.data_stories`.

**5. From the Couch** (editorial grid)
Layout: 1 feature (2fr, spans 2 rows) + 4 side reads (1fr each). Border grid, no gap.
- Feature: has illustration area (theme-colored background + animated geo), content type, headline, dek, meta
- Side reads: type, headline, meta only
- All items from `couch_content` where `theme_id = theme.id`, ordered by `is_feature DESC, position ASC`

**6. Control Panel** (destination instruments grid)
- Section header: kicker + heading
- Grid: 4 columns desktop → 3 tablet → 2 mobile. **No gap between instruments.** Border: 2px solid ink outer, 2px solid ink between cells.
- Each instrument is a link to `/{region}/{destination.slug}`

**Instrument spec:**
```
Top: square face (aspect-ratio: 1/1)
  - Background: theme-lt color
  - Center: geo SVG at 85% width, opacity .14, transitions to .22 on hover + slight rotate
  - Overlay: status arc SVG (partial circle ring)
    - Track circle: stroke rule color, stroke-width 4
    - Fill arc: stroke theme color, stroke-width 4
    - Arc fill % = (trail_levels_loaded / 5) * 100 → convert to stroke-dashoffset
    - Formula: circumference = 2π × 42 ≈ 263.9
    - dashoffset = 263.9 × (1 - fill_pct)
    - Arc starts at top: transform="rotate(-90 50 50)"

Bottom: label panel
  - Destination name: Fraunces 700, .85rem
  - Level dots: 5 dots, 5px, filled = theme color, unfilled = rule color
  - Status text: DM Mono .52rem uppercase — "N of 5 levels" or "Active legislation" (civic red)
  - "Explore →" link: DM Mono .56rem, blue

Hover state: background shifts to theme-lt, geo opacity increases, no border-radius
```

---

## PAGE TYPE 2: FOCUS AREA HUB

Route: `app/[region]/[destination]/page.tsx`

### Data fetch:
```ts
const focusArea = await supabase
  .from('focus_areas')
  .select(`
    *,
    themes ( name, slug, color ),
    resources (
      id, slug, title, content_type, trail_level, source_name,
      duration, is_active, active_label, geo_type
    )
  `)
  .eq('slug', params.destination)
  .single()
```

### Layout sections:

**1. Wayfinder**
`crumbs: [Guide, { label: theme.name, href: '/health' }, { label: focusArea.name, here: true }]`
`trailLabel: 'Trail depth'`
`trailLevel: focusArea.max_trail_level`

**2. Focus Masthead** (`.focus-mast`)
- Darker gradient of the theme color
- Geo SVG background (the focus area's specific geo type), animated, opacity .1
- Back link: `← [Theme Name] · Region 0{n}` (DM Mono, rgba white .4)
- H1: Fraunces 900, clamp(2rem, 4.5vw, 3.5rem), white. Includes the geo mark SVG (44×44, opacity .65) inline before the text.
- Deck: Libre Baskerville italic, rgba white .55

**3. Five-Level Trail** (`.focus-trail`)

Each level = 2-column layout: spine (180px) + content area (1fr). Drops to 1 col mobile (spine becomes a horizontal bar).

**Spine spec:**
- Background: paper (#f4f5f7)
- Small geo SVG watermark, bottom-right, opacity .06
- Pip dot (level color — blue/health/hood/voice/ink)
- Level tag: DM Mono .56rem uppercase (level color)
- Level name: Fraunces 700 .88rem
- Level type: italic .72rem (travel guide descriptor)
- Count: DM Mono .58rem, faint color. Right-aligned on mobile.
- Level 5: count in civic red if `has_active` is true

**Travel guide level names and descriptors:**
```
Level 1 · Before You Go      — News, data, explainers
Level 2 · Packing List       — Guides, tools, self-study
Level 3 · Day Trips          — Classes, events near you
Level 4 · Local Guides       — Organizations & services
Level 5 · The Deep Journey   — Officials, policy, live action
```

**Content entries** (`.ft-entry`):
- Border: 1px solid rule. Left border: 3px solid civic red ONLY on Level 5 active items
- Contains: small geo SVG (36×36, opacity .5) + body (type tag, title, meta) + arrow
- Hover: border becomes theme color, background becomes theme-lt
- Each entry links to `/{region}/{destination}/{resource.slug}`

---

## PAGE TYPE 3: RESOURCE PAGE

Route: `app/[region]/[destination]/[resource]/page.tsx`

### Data fetch:
```ts
const resource = await supabase
  .from('resources')
  .select(`
    *,
    focus_areas (
      id, slug, name, geo_type,
      themes ( name, slug, color )
    ),
    resource_services (*),
    related_focus_areas: focus_area_resources (
      focus_areas ( id, slug, name, geo_type,
        themes ( slug, color )
      )
    ),
    related_resources (
      id, slug, title, content_type, trail_level, source_name
    )
  `)
  .eq('slug', params.resource)
  .single()
```

### Layout sections:

**1. Wayfinder**
`crumbs: [Guide, theme, focusArea, { label: resource.name, here: true }]`
`trailLabel: 'You are at'`
`trailLevel: resource.trail_level`

**2. Resource Masthead** (white background, 2px ink border bottom)
Left column:
- Eyebrow: type pill (ink background, white text, DM Mono) + breadcrumb text
- H1: Fraunces 900, clamp(1.8rem, 4vw, 3rem)
- Sub: Libre Baskerville italic, dim color
- Quick facts row: 3 facts (dot pip + label + value, DM Mono .62rem)

Right column:
- Geo SVG mark (80×80, opacity .35)
- Primary CTA button (theme color background, white, DM Mono uppercase)
- Phone/URL (DM Mono .62rem, dim)

**3. Resource Body** (2-column: 2fr main + 1fr sidebar. 1 col mobile)

Main:
- Section label (DM Mono kicker)
- Body heading (Fraunces 700, 1.15rem)
- Body copy: Libre Baskerville .88rem, line-height 1.85. This is **editorial prose**, not bullet lists.
- Services list: pip dot + service name (700) + service description (italic, dim). Bordered list.

Sidebar:
- **Trail position block**: "Where this fits on the trail" — 5 levels listed, current level has active pip (theme color) and bold text
- **Also appears in block**: "Also part of these destinations" — linked cards with geo mark + dest name + type
- **Next steps block**: 3 action buttons (primary = theme color, secondary = rule border)

**4. Related Resources** (3-column grid, 1 col mobile)
- Dog-ear effect: `::after` pseudo-element, triangle cut from top-right corner (border trick, no border-radius)
- Type tag, title (Fraunces 700), meta (DM Mono)

---

## SUPABASE SCHEMA

```sql
-- Core tables

themes (
  id uuid primary key,
  slug text unique,
  name text,
  region_num int,
  color text,              -- CSS hex e.g. '#1a6b56'
  color_lt text,           -- Light version
  color_dk text,           -- Dark version
  geo_type text,           -- Which SVG component
  hed_em text,             -- Italic part of H1
  deck text,
  feature_lede text,
  pull_quotes jsonb,       -- [{ quote, source }]
  data_stories jsonb,      -- [{ num, hed, copy }]
  stats jsonb              -- [{ num, desc }]
)

focus_areas (
  id uuid primary key,
  theme_id uuid references themes,
  slug text unique,
  name text,
  brief text,
  geo_type text,
  trail_levels_loaded int default 0,
  max_trail_level int default 5,
  has_active_civic boolean default false,
  position int
)

resources (
  id uuid primary key,
  slug text unique,
  title text,
  content_type text,       -- 'organization' | 'article' | 'legislation' | 'guide' | 'video' | 'data' | 'podcast' | 'book' | 'diy_kit' | 'event' | 'course' | 'service'
  trail_level int,         -- 1–5
  source_name text,
  duration text,
  cost text,
  location text,
  hours text,
  contact text,
  url text,
  is_active boolean,       -- active civic item (legislation, open comment)
  active_label text,       -- e.g. "Comment open now" "In committee"
  active_deadline date,
  geo_type text,
  body_hed text,
  body_copy text,          -- Full editorial prose, markdown OK
  services jsonb,          -- [{ name, description }]
  quick_facts jsonb,       -- [{ label, value }]
  next_steps jsonb         -- [{ label, href, style }] style: 'primary'|'secondary'
)

focus_area_resources (
  focus_area_id uuid references focus_areas,
  resource_id uuid references resources,
  primary boolean default false
)

couch_content (
  id uuid primary key,
  theme_id uuid references themes,
  focus_area_id uuid references focus_areas, -- nullable
  slug text,
  content_type text,
  title text,
  dek text,
  source text,
  duration text,
  url text,
  is_feature boolean default false,
  position int
)
```

---

## COMPONENT FILE STRUCTURE

```
components/
  layout/
    SiteNav.tsx
    Wayfinder.tsx

  geo/
    VesicaPiscis.tsx
    FlowerOfLife.tsx
    CompassRose.tsx
    NestedCircles.tsx
    OutwardSpiral.tsx
    HubAndSpokes.tsx
    SixPetalRose.tsx
    Torus.tsx
    SeedOfLife.tsx
    HexGrid.tsx
    ConcentricRings.tsx
    GoldenSpiral.tsx
    MetatronCube.tsx
    index.ts              — exports all, maps geo_type string to component

  theme/
    ThemeMasthead.tsx
    FeatureOpener.tsx
    DataStories.tsx
    CouchGrid.tsx
    ControlPanel.tsx
    Instrument.tsx        — single destination instrument

  focus/
    FocusMasthead.tsx
    TrailLevel.tsx        — one level (spine + content)
    TrailEntry.tsx        — one resource entry within a level

  resource/
    ResourceMasthead.tsx
    ResourceBody.tsx
    ResourceSidebar.tsx
    TrailPosition.tsx
    RelatedResources.tsx

  ui/
    DogEarCard.tsx        — card with torn-corner pseudo-element
    PipDot.tsx            — colored status dot
    SectionHeader.tsx     — kicker + heading + optional "see all" link
    LevelBadge.tsx        — level pill (type pill with level color)
```

---

## GEO COMPONENT LOOKUP

The `geo_type` field in the database maps to a component:

```ts
// components/geo/index.ts
export const GEO_MAP: Record<string, React.ComponentType<GeoProps>> = {
  vesica_piscis:    VesicaPiscis,      // Mental Health
  flower_of_life:   FlowerOfLife,      // Food Access, theme backgrounds
  compass_rose:     CompassRose,       // Healthcare Access
  nested_circles:   NestedCircles,     // Maternal Health
  outward_spiral:   OutwardSpiral,     // Substance Use & Recovery
  hub_and_spokes:   HubAndSpokes,      // Disability & Access
  six_petal_rose:   SixPetalRose,      // Oral Health
  torus:            Torus,             // Environmental Health, Our Planet
  seed_of_life:     SeedOfLife,        // Nav, Our Families
  hex_grid:         HexGrid,           // Our Neighborhood
  concentric_rings: ConcentricRings,   // Our Voice
  golden_spiral:    GoldenSpiral,      // Our Money
  metatron_cube:    MetatronCube,      // The Bigger We
}

export function Geo({ type, ...props }: { type: string } & GeoProps) {
  const Component = GEO_MAP[type]
  if (!Component) return null
  return <Component {...props} />
}
```

---

## MOBILE RULES

```
Control panel grid:  4 col → 3 col (900px) → 2 col (600px)
Feature opener:      2 col → 1 col (680px)
Data stories:        3 col → 1 col (680px)
Couch grid:          magazine layout → single column stack (680px)
Trail level:         2 col (spine + content) → spine becomes horizontal bar (680px)
Resource grid:       2fr+1fr → 1 col (680px). Sidebar moves below main.
Related grid:        3 col → 1 col (680px)

Wayfinder crumb:     horizontal scroll, hide scrollbar. Trail dots always visible.
SiteNav:             logo + edition left, CTA only right. Hide "Regions" and "Routes" links.
```

---

## PERFORMANCE NOTES

- All geo SVGs are inline (no external fetch). They are React components, not img tags.
- Animations (`animated` prop) use CSS `animation: spin Xs linear infinite`. Apply sparingly — only on hero/masthead backgrounds.
- Instrument arc animation: none. The arc is static data visualization, not animated.
- Images: none in the current design. Placeholder backgrounds are gradients.
- Fonts: load via `next/font/google`. Fraunces with `axes: [{ tag: 'opsz', value: 144 }]`.

---

## DESIGN CONSTRAINTS — NEVER DO THESE

```
Never: border-radius on cards, panels, buttons, or containers
Never: emojis anywhere — use Geo SVG components instead
Never: Inter, Roboto, system-ui, or sans-serif body copy
Never: bullet point lists in body copy — write prose or use bordered service lists
Never: "Our Health", "Our Families" etc. in route slugs or nav — use "health", "families"
Never: purple gradient on white — that's generic AI design
Never: card shadows as primary depth — use borders
Never: center-aligned body copy — left-align everything except hero stats and callouts
Never: lorem ipsum — use real placeholder copy from this document
```

---

## VOICE AND COPY RULES

These apply to any generated copy or placeholder text:

- Short sentences. Truth first.
- No jargon. 6th–8th grade reading level.
- Asset-based framing — start from what people bring, not what they lack.
- "We" language — inclusive first person, never third-person distancing.
- Travel guide voice: "head here", "explore", "your destination" — not "access", "view", "utilize".
- Never above the reader. Neighbor, not nonprofit.

---

## BUILD ORDER

Start here, in this order:

1. `tailwind.config.ts` — all tokens
2. `components/geo/` — all 13 SVG components
3. `components/layout/SiteNav.tsx` and `Wayfinder.tsx`
4. Theme Hub page (`app/[region]/page.tsx`) + all sub-components
5. Focus Area Hub page (`app/[region]/[destination]/page.tsx`)
6. Resource page (`app/[region]/[destination]/[resource]/page.tsx`)
7. Supabase client setup + data fetching layer
8. Seed data: Health region (8 focus areas, 3–5 resources each)
9. Deploy to Vercel, connect `exchange.thechangelab.net`

---

## REFERENCE

The full design mockup with all three page templates is in `change-engine-page-system.html`. When in doubt about a visual decision, match that file exactly. Do not redesign — implement.

The Change Lab · Houston, TX · changeengine.us
```
