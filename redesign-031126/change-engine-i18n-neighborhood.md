# Change Engine — i18n + Neighborhood Wiring Addendum
## Add to project root alongside change-engine-reskin-reconciled.md

This addendum extends the reskin prompt with complete implementation
instructions for two systems that are fully built in the backend but
never wired to the UI: multilingual support (EN/ES/VI) and neighborhood
personalization (ZIP-based content filtering).

Read this file alongside `change-engine-reskin-reconciled.md`.
These instructions override the GAP 4 section in that file.

---

## PART A — INTERNATIONALIZATION (EN / ES / VI)

### What already exists (do not modify)

```
src/lib/contexts/LanguageContext.tsx   — context + useLanguage hook
src/lib/i18n.ts                        — all translation strings
src/middleware.ts                      — locale detection (do not touch)
```

### How the system works

`LanguageContext` provides the current language (`'en' | 'es' | 'vi'`)
and a `t(key)` translation function. Every user-facing string must go
through `t()` — never hardcode English in JSX.

The `inbox_id` field on content entities is the translation lookup key.
It links a piece of content to its translated versions in the database.
Never use it for routing.

### Rule for every component you write or modify

```typescript
// At the top of every component that renders user-facing text:
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function MyComponent() {
  const { t, language } = useLanguage()

  return (
    <p>{t('namespace.key')}</p>   // ✓ correct
    // not
    <p>English string</p>          // ✗ wrong
  )
}
```

### Language switcher — wire it into the nav

The `TranslateBar` component already exists in the layout. Make sure
it is visible and functional in the new nav design. It must appear on
every page. Do not remove or hide it during the reskin.

If the new nav design relocates language switching (e.g. into a menu),
preserve the full `TranslateBar` component — do not rebuild it.

### New strings for new UI — add to i18n.ts

When the reskin adds new UI copy that doesn't exist in `i18n.ts` yet
(neighborhood prompts, "near you" labels, related items section headers,
promo slot copy), add all three languages:

```typescript
// src/lib/i18n.ts — add under appropriate namespace

neighborhood: {
  prompt: {
    en: 'What\'s happening near you?',
    es: '¿Qué está pasando cerca de ti?',
    vi: 'Có gì đang xảy ra gần bạn?',
  },
  set_zip: {
    en: 'Set your neighborhood',
    es: 'Establece tu vecindario',
    vi: 'Đặt khu phố của bạn',
  },
  near_you: {
    en: 'Near you',
    es: 'Cerca de ti',
    vi: 'Gần bạn',
  },
  change: {
    en: 'Change neighborhood',
    es: 'Cambiar vecindario',
    vi: 'Thay đổi khu phố',
  },
},

related: {
  heading: {
    en: 'Related',
    es: 'Relacionado',
    vi: 'Liên quan',
  },
  services: {
    en: 'Related services',
    es: 'Servicios relacionados',
    vi: 'Dịch vụ liên quan',
  },
  officials: {
    en: 'Your representatives',
    es: 'Tus representantes',
    vi: 'Đại diện của bạn',
  },
},

wayfinder: {
  guide: {
    en: 'Guide',
    es: 'Guía',
    vi: 'Hướng dẫn',
  },
  trail_depth: {
    en: 'Trail depth',
    es: 'Profundidad del sendero',
    vi: 'Độ sâu đường mòn',
  },
  you_are_at: {
    en: 'You are at',
    es: 'Estás en',
    vi: 'Bạn đang ở',
  },
},
```

If you cannot find an existing key for a string, add it. Never skip
the translation — placeholder strings like `'[ES]'` or `'TODO'` are
not acceptable. Use the translations above as a starting point and
extend as needed.

### RTL / font rendering

Vietnamese uses diacritics that render correctly in Libre Baskerville.
No special font handling needed. Test with real VI strings to confirm
line heights are acceptable.

### Language persistence

`LanguageContext` handles persistence. Do not add any additional
localStorage or cookie logic for language in components.

---

## PART B — NEIGHBORHOOD PERSONALIZATION

### What already exists (do not modify)

```
src/lib/contexts/NeighborhoodContext.tsx  — context + ZIP storage
src/lib/data/neighborhood.ts              — all data functions
```

### Data functions available

```typescript
// All in src/lib/data/neighborhood.ts — do not modify these files,
// only call them from page.tsx or server components

getContentForNeighborhood(neighborhoodId: string)
getServicesByZip(zip: string)
getServicesByNeighborhood(neighborhoodId: string)
getPoliciesForNeighborhood(neighborhoodId: string)
getOrganizationsByNeighborhood(neighborhoodId: string)
getMapMarkersForNeighborhood(neighborhoodId: string)
getMapMarkersForSuperNeighborhood(superNeighborhoodId: string)
```

### How NeighborhoodContext works

```typescript
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'

const { zip, neighborhoodId, setZip, clearZip } = useNeighborhood()

// zip           — raw ZIP string entered by user, e.g. "77004"
// neighborhoodId — resolved neighborhood UUID from the database
// setZip(zip)   — stores ZIP, resolves to neighborhoodId automatically
// clearZip()    — resets both
```

`neighborhoodId` will be `null` until the user sets a ZIP. Design
around this — always show a fallback when it's null.

### Where to wire it in

#### 1. Persistent neighborhood bar — add to layout

Add a thin bar directly below the Wayfinder on every page.
This replaces the placeholder from the reskin prompt.

```
[ ZIP set ]    "Near 77004  ·  Midtown Houston  ·  Change"
[ ZIP not set ] "What's happening near you?  ·  Set your neighborhood →"
```

Visual spec:
- Background: `paper` (#f4f5f7)
- Border bottom: 1px solid `rule` (#dde1e8)
- Text: DM Mono, .62rem, uppercase, `dim` color
- ZIP/neighborhood name: `ink` color, bold
- "Change" and "Set your neighborhood" links: `blue` color
- No border-radius. Full width.

Implementation:

```typescript
// src/components/layout/NeighborhoodBar.tsx
'use client'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function NeighborhoodBar() {
  const { zip, neighborhoodId, neighborhoodName } = useNeighborhood()
  const { t } = useLanguage()

  if (zip) {
    return (
      <div className="neighborhood-bar">
        <span>{t('neighborhood.near_you')}: </span>
        <strong>{neighborhoodName || zip}</strong>
        <span> · </span>
        <button onClick={openZipModal}>{t('neighborhood.change')}</button>
      </div>
    )
  }

  return (
    <div className="neighborhood-bar">
      <button onClick={openZipModal}>
        {t('neighborhood.prompt')} · {t('neighborhood.set_zip')} →
      </button>
    </div>
  )
}
```

Add to `src/app/(exchange)/layout.tsx` below the Wayfinder.

#### 2. ZIP entry modal

Create `src/components/layout/ZipModal.tsx`.

Simple modal, no library needed:
- Input: ZIP code (5 digits)
- On submit: calls `setZip(zip)` from NeighborhoodContext
- Error state: "We don't have data for that ZIP yet" if `neighborhoodId`
  resolves to null after setting
- Success: closes modal, neighborhood bar updates immediately

Visual spec:
- Full-screen overlay: `rgba(13,17,23,0.7)` (ink at 70%)
- Modal panel: white, 2px solid ink border, no border-radius
- Heading: Fraunces 700, 1.4rem
- Input: full width, 2px solid ink border, DM Mono, no border-radius
- Submit button: ink background, white text, DM Mono uppercase
- Close: top-right ×, DM Mono

#### 3. Homepage — "Near you" section

Below the pathway grid, add a neighborhood content section.
Only renders when `neighborhoodId` is set.

```typescript
// In app/(exchange)/(pages)/page.tsx — add to the JSX return:
// (data fetching happens in a client component or via Suspense)

{neighborhoodId && (
  <NeighborhoodSection neighborhoodId={neighborhoodId} />
)}
```

```typescript
// src/components/neighborhood/NeighborhoodSection.tsx
'use client'

// Fetches and renders:
// - getServicesByNeighborhood(neighborhoodId) → top 3 services
// - getOrganizationsByNeighborhood(neighborhoodId) → top 3 orgs
// - getContentForNeighborhood(neighborhoodId) → top 3 content items

// Layout: section header + 3-column card grid for each type
// Section header: DM Mono kicker "Near [neighborhood name]" +
//   Fraunces heading "What's happening in your neighborhood"
// Cards: same card component as browse pages
// "See more near you →" link at bottom of each row
```

#### 4. Pathway pages — local filter

On pathway pages, when `neighborhoodId` is set, add a toggle:

```
[ All Houston ]  [ Near you ]
```

DM Mono tab strip. "Near you" filters the content feed to neighborhood-
relevant results using `getContentForNeighborhood(neighborhoodId)`.
Falls back to full pathway feed when no neighborhood is set.

```typescript
// In pathway page JSX (client component):
const [localFilter, setLocalFilter] = useState(false)
const { neighborhoodId } = useNeighborhood()

const content = localFilter && neighborhoodId
  ? neighborhoodContent   // from getContentForNeighborhood()
  : pathwayContent        // from existing pathway data fetch
```

#### 5. Browse pages (services, organizations)

On `/services` and `/organizations` listing pages, wire in ZIP filtering:

When `zip` is set:
- Show neighborhood-filtered results first as a "Near you" section
- Full browse list below with a "Showing all Houston" label
- Use `getServicesByZip(zip)` for the filtered results

When `zip` is not set:
- Show "Set your neighborhood to see what's near you" prompt card
  at the top of the list (same style as neighborhood bar prompt)

#### 6. Map pages

Map components use Leaflet. Already wrapped in `dynamic import` with
`ssr: false` — do not change this.

When `neighborhoodId` is set, pass it to the map component:

```typescript
// Use existing map data functions:
const markers = neighborhoodId
  ? await getMapMarkersForNeighborhood(neighborhoodId)
  : await getAllMapMarkers()   // existing function
```

Center the map on the neighborhood when ZIP is set.
Fall back to Houston center coordinates (29.7604° N, 95.3698° W)
when no ZIP is set.

---

## COMPONENT FILE SUMMARY

New files to create for this addendum:

```
src/components/layout/NeighborhoodBar.tsx   — persistent bar in layout
src/components/layout/ZipModal.tsx          — ZIP entry modal
src/components/neighborhood/
  NeighborhoodSection.tsx                   — homepage near-you section
  NeighborhoodServices.tsx                  — ZIP-filtered service cards
  NeighborhoodOrgs.tsx                      — ZIP-filtered org cards
  NeighborhoodContent.tsx                   — ZIP-filtered content cards
```

Files to modify (JSX return only):

```
src/app/(exchange)/layout.tsx               — add NeighborhoodBar
src/app/(exchange)/(pages)/page.tsx         — add NeighborhoodSection
src/app/(exchange)/(pages)/pathways/[slug]/page.tsx  — add local toggle
src/app/(exchange)/(pages)/services/page.tsx         — add ZIP filter
src/app/(exchange)/(pages)/organizations/page.tsx    — add ZIP filter
src/lib/i18n.ts                             — add new string keys
```

---

## DESIGN CONSTRAINTS FOR BOTH SYSTEMS

i18n and neighborhood features follow the same design rules as the
rest of the reskin:

- DM Mono uppercase for all labels, ZIP codes, neighborhood names
- Fraunces for section headings
- Libre Baskerville for body copy in prompts and descriptions
- No border-radius on the neighborhood bar, modal, or filter tabs
- No emojis — use a ConcentricRings geo mark next to "Near you" headings
  to signal place/community
- The neighborhood bar and ZIP modal must work in all three languages —
  use `t()` for every string
