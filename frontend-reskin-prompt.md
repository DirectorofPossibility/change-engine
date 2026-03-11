# Frontend Reskin Prompt — Change Engine

> Copy this entire prompt into a new Claude conversation along with your design screenshots/artifacts.

---

## Role

You are reskinning the frontend of **Change Engine**, a civic engagement platform built with Next.js 14 (App Router), React 18, Tailwind CSS 3.4, and Supabase. The database and data layer are **dominant** — you must not change database schemas, API routes, data-fetching functions, or Supabase queries. The frontend must adapt to what the database provides.

## Critical Rules

### The Database Is Dominant

1. **Never modify anything in `src/lib/data/`** — these are the canonical data-fetching functions. Every page gets its data shape from these functions. Your components must render whatever these functions return.
2. **Never modify `src/lib/supabase/database.types.ts`** — this is auto-generated from the database.
3. **Never modify `src/lib/types/`** — these types reflect the database schema. Your components must conform to them.
4. **Never modify `src/app/api/`** — API routes are backend concerns.
5. **Never modify `src/middleware.ts`** — auth and route protection must stay intact.
6. **Never change the page-level data fetching in `page.tsx` files** — keep the same function calls and data flow. Only change what's rendered with that data.

### What the Database Gives You (work with these, not against them)

Each page receives a specific data shape from Supabase. Before redesigning any page, read its `page.tsx` to see exactly what data is fetched, then design your component to consume that exact shape. Key fields you'll find on most entities:

- `id` (UUID) — routing key
- `title_6th_grade` / `summary_6th_grade` — AI-simplified text (use these for display)
- `pathway_primary` — theme ID for color coding (THEME_01 through THEME_07)
- `center` — engagement mode (Learning, Action, Resource, Accountability)
- `focus_area_ids` — array of focus area UUIDs for tagging
- `image_url` — optional thumbnail
- `inbox_id` — translation lookup key (NEVER use for routing)

### Routing Rules (Non-Negotiable)

- Every `href` must point to an existing `page.tsx` file
- Use `content_published.id` (UUID) for content routes: `/content/{id}`
- Never use `inbox_id` for routing — only for translation lookup
- ContentCard accepts an `href` prop — use it for explicit routing overrides

### Recent Infrastructure Updates (already done)

These changes were made to prepare for the reskin:
- **`database.types.ts` regenerated** — all tables now have proper TypeScript types (previously `opportunities`, `official_profiles`, `foundations`, `guides`, `quotes`, `promotions` were missing, forcing `as any` casts)
- **`getActivePromotions(pathwayId?, limit?)`** added to `lib/data/homepage.ts` — queries the `promotions` table, filters by `is_active`, date window, and optional pathway
- **V1/V2 layout toggle removed** — single D2 layout in `(exchange)/layout.tsx`
- **8 error boundaries added** — all detail pages now have `error.tsx`
- **4 dead data functions removed** — `getTirzZoneBySiteNumber`, `getKnowledgeGraphData`, `getThemeDrillDown`, `getPolicyOfficialIds`

## What You're Reskinning

You are replacing the **component layer** — everything in `src/components/` — and the **layout/styling** in page files. You are NOT changing the data layer, API layer, auth, or routing structure.

### Files You CAN Modify

- `src/components/**/*` — all components (rebuild as needed)
- `src/app/(exchange)/layout.tsx` — public layout (Header, Footer, providers)
- `src/app/(exchange)/(pages)/*/page.tsx` — the JSX return only (keep data fetching intact)
- `src/app/globals.css` — global styles
- `tailwind.config.ts` — design tokens, colors, fonts, shadows
- `src/lib/constants.ts` — only visual constants (colors, labels), never data constants
- `src/lib/i18n.ts` — UI strings if adding new copy

### Files You Must NOT Modify

- `src/lib/data/**` — data access layer
- `src/lib/supabase/**` — database connection
- `src/lib/types/**` — type definitions
- `src/app/api/**` — API routes
- `src/middleware.ts` — auth/routing
- `src/lib/contexts/**` — LanguageContext, NeighborhoodContext (keep the interfaces)
- `supabase/**` — migrations, edge functions

## Design Elements to Integrate

### Flower of Life (FOL) — Unique Per Pathway

Every pathway page should feature a **Flower of Life** element styled with that pathway's color. Existing FOL components to build on:

- `FlowerIcons.tsx` — base SVG icon
- `FOLElements.tsx` — individual pattern elements
- `GradientFOL.tsx` — gradient variant
- `FOLWatermark.tsx` — low-opacity watermark
- `FOLLoading.tsx` — animated loading spinner
- `HeroFOLBackground.tsx` — full animated background

**Each pathway gets its own FOL treatment:**
| Pathway | Color | FOL Style Suggestion |
|---------|-------|---------------------|
| Health | #e53e3e | Pulsing/breathing FOL |
| Families | #dd6b20 | Warm radiating FOL |
| Neighborhood | #d69e2e | Grounded/rooted FOL |
| Voice | #38a169 | Expanding/amplifying FOL |
| Money | #3182ce | Structured/geometric FOL |
| Planet | #319795 | Organic/flowing FOL |
| The Bigger We | #805ad5 | Connected/interlocking FOL |

### Promotions

The database has a **promotions** system. The dashboard at `/dashboard/promotions` manages featured content and banners. The existing `FeaturedPromo` component accepts:

```typescript
{ title: string, description: string, cta: string, href: string, bgColor?: string }
```

Design promotional placements for:
- Homepage hero or above-the-fold banner
- Pathway page featured spots
- Sidebar promotion slots
- Detail page contextual promos (related to content theme)

The `getQuotes()` and `getFeaturedContent()` functions in `lib/data/homepage.ts` supply this data.

### Quotes

The `quotes` table provides testimonials/quotes. `getQuotes(pathwayId?, limit?)` and `getRandomQuote(pathwayId?)` are available. The existing `QuoteCard` component renders these.

Design quote placements for:
- Detail pages (service, official, policy, etc.) — contextual quote matching the pathway
- Pathway pages — pathway-specific quotes
- Homepage — rotating featured quote
- Between content sections as visual breaks

Quote data shape:
```typescript
{ id, quote_text, attribution, pathway_id, is_active, created_at }
```

## Gaps to Fill During Reskin

The current frontend has significant gaps where backend infrastructure exists but was never wired to the UI. **The reskin is your opportunity to close these gaps.**

### GAP 1: Promotions — Wire Them In (REQUIRED)

The `promotions` table and `/dashboard/promotions` admin CRUD are fully functional. `FeaturedPromo` component exists. But **zero public pages render promotions**. Admins create promotions that nobody sees.

Your reskin MUST include promotion placements:
- **Homepage**: Hero banner or above-fold promo slot
- **Pathway pages**: Featured promo matching the pathway
- **Browse pages** (services, officials, etc.): Sidebar promo slot
- **Detail pages**: Contextual promo matching the entity's pathway

Data access: Use `getFeaturedContent()` from `lib/data/homepage.ts`, or query the `promotions` table directly with a new function. Filter by `is_active = true` and `start_date <= now <= end_date`.

```typescript
// Promotion data shape from database
{
  promo_id: string
  title: string
  subtitle: string | null
  description: string | null
  promo_type: 'partner_spotlight' | 'event' | 'resource' | 'campaign' | 'announcement'
  image_url: string | null
  cta_text: string
  cta_href: string
  color: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  display_order: number
}
```

### GAP 2: Quotes — Wire Them In (REQUIRED)

The `quotes` table, `/dashboard/quotes` admin CRUD, `QuoteCard` component, AND data functions (`getQuotes()`, `getRandomQuote()`) all exist. But **no public page ever calls them**.

Your reskin MUST include quote placements:
- **Detail pages**: Contextual quote matching the entity's `pathway_primary`
- **Pathway pages**: Pathway-specific quotes as section breaks
- **Homepage**: Rotating featured quote
- **Between sections**: Use quotes as visual breathing room / editorial breaks

Data access: `getQuotes(pathwayId?, limit?)` and `getRandomQuote(pathwayId?)` in `lib/data/homepage.ts`.

```typescript
// Quote data shape from database
{
  quote_id: string
  quote_text: string
  attribution: string
  source_url: string | null
  pathway_id: string | null  // null = general quote, otherwise pathway-specific
  is_active: boolean
  display_order: number
}
```

### GAP 3: Related Items on Detail Pages (REQUIRED)

Every detail page (service, official, policy, organization, opportunity) should show related items. The data functions exist but are never called:

- `getRelatedOfficials(focusAreaIds)` — officials sharing focus areas with this entity
- `getRelatedServices(focusAreaIds)` — services sharing focus areas
- `getRelatedPolicies(focusAreaIds)` — policies sharing focus areas
- `getRelatedOpportunities(focusAreaIds)` — opportunities sharing focus areas
- `getRelatedContentForGuide(focusAreaIds)` — content related to a guide
- `getRelatedOrgsForGuide(focusAreaIds)` — orgs related to a guide

**Implementation**: On each detail page, grab the entity's `focus_area_ids`, call the relevant `getRelated*()` functions, and render a "Related" section with cards.

### GAP 4: Neighborhood Personalization (RECOMMENDED)

12+ data functions exist for ZIP-based content filtering that was never implemented:

- `getContentForNeighborhood(neighborhoodId)`
- `getServicesByZip(zip)` / `getServicesByNeighborhood(neighborhoodId)`
- `getPoliciesForNeighborhood(neighborhoodId)`
- `getOrganizationsByNeighborhood(neighborhoodId)`
- `getMapMarkersForNeighborhood(neighborhoodId)` / `getMapMarkersForSuperNeighborhood(snId)`

The `NeighborhoodContext` already stores the user's ZIP code. If your design includes a "your neighborhood" or "near you" experience, **the entire backend is ready**.

### GAP 5: Pathway Drill-Down Functions (RECOMMENDED)

Pathway pages (`/pathways/[slug]`) could be much richer using:

- `getPathwayBraidedFeed(themeId)` — braided content feed by center
- `getCenterContentForPathway(themeId)` — content broken down by center
- ~~`getThemeDrillDown(themeId)`~~ — removed (use `getPathwayContent` + `getRelated*` instead)
- `getPathwayTopics(themeId)` — topics within the pathway

### GAP 6: Stub Pages That Need Real Content

| Route | Current State | What It Needs |
|-------|--------------|---------------|
| `/campaigns/[id]` | 87 lines, just a progress bar | Timeline, updates, related content, call-to-action |
| `/learning-paths/[id]` | Shows module count but no actual modules | Fetch and render module list/curriculum |
| `/donate` | Placeholder PayPal button ID | Real donation integration or link |

### GAP 7: Missing Error Boundaries

Add `error.tsx` to these 8 detail routes:
`/adventures/[slug]`, `/benefits/[id]`, `/campaigns/[id]`, `/learning-paths/[id]`, `/collections/[id]`, `/agencies/[id]`, `/help/[slug]`, `/elections/[id]`

### GAP 8: V1/V2 Layout Toggle — RESOLVED

The v1/v2 design cookie toggle has been removed. `(exchange)/layout.tsx` now renders only the D2 layout (D2Nav, TranslateBar, D2Footer, TickerTape, OnboardingLoader, ChanceChatWidget). Legacy v1 component files (`Header.tsx`, `Footer.tsx`, `LeftNav.tsx`, `MobileBottomNav.tsx`) still exist but are no longer imported — delete them when replacing with your new design.

---

## Current Design System (Preserve or Evolve)

### Colors to Keep (or evolve from)

The warm, earthy palette is core to the brand identity:
- Cream backgrounds (#FAF8F5)
- Warm orange accent (#C75B2A)
- 7 pathway colors (health red → bigger-we purple)
- 4 center colors

### Typography to Keep

- DM Serif Display for headings (editorial, warm)
- DM Sans for body (clean, readable)
- Space Mono for meta labels (structured, technical)
- Caveat for handwritten accents (personal, approachable)

### Patterns to Preserve

- **Pathway color coding** — every entity displays its pathway color
- **Center badges** — Learning/Action/Resource/Accountability indicators
- **i18n support** — all user-facing text must support EN/ES/VI
- **Accessibility** — visible focus indicators, ARIA labels, keyboard navigation
- **Responsive** — mobile-first with bottom nav on mobile

## How to Approach Each Page

For every page you redesign:

1. **Read the `page.tsx`** — understand what data is fetched and what's passed to components
2. **Read the current component** — understand what's rendered today
3. **Check the data type** — look at `src/lib/types/exchange.ts` or `dashboard.ts` for the exact shape
4. **Design the new component** to consume the SAME props/data
5. **Keep the same file structure** — replace component internals, not the import paths
6. **Test that all data fields are used** — if the database provides `focus_area_ids`, your new design should display them

## Reference Document

Read `project-audit.md` in the project root for a complete inventory of:
- Every route and what data it fetches
- Every component and what it renders
- Full database schema and table relationships
- Complete styling tokens and design system
- Known issues and incomplete features

## Checklist Before You Start

- [ ] Read `project-audit.md` thoroughly (especially Section 8 — Gaps)
- [ ] Review the design screenshots/artifacts provided
- [ ] Identify which pages are changing
- [ ] Verify data shapes match your component designs
- [ ] Plan FOL variants for each pathway (unique per pathway color)
- [ ] Plan promotion placements (GAP 1 — homepage, pathway, sidebar, detail pages)
- [ ] Plan quote placements (GAP 2 — detail pages, pathway pages, section breaks)
- [ ] Plan "Related Items" sections on detail pages (GAP 3 — use getRelated*() functions)
- [ ] Decide on neighborhood personalization (GAP 4 — backend ready, design needed)
- [ ] Decide on pathway drill-down depth (GAP 5 — braided feeds, center breakdowns)
- [ ] Add error.tsx to 8 detail routes missing them (GAP 7)
- [x] ~~Remove v1/v2 layout toggle~~ — DONE, D2 layout is now the only layout
- [ ] Ensure i18n hooks are preserved in new components
- [ ] Ensure map components (Leaflet) are kept or wrapped (they need `ssr: false`)
