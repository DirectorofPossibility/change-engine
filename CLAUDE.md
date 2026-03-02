# The Change Engine

Civic engagement platform for Houston, TX that ingests, classifies, and publishes community resources across seven thematic pathways. Content is AI-classified using Claude, translated to Spanish and Vietnamese, and served through a Next.js frontend with a Supabase backend.

**Live site**: https://www.changeengine.us
**Deployment**: Vercel (auto-deploys from git)

## Quick Reference

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build (validates all routes)
npm run lint     # Run ESLint
npm start        # Start production server
```

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript strict mode)
- **Database**: Supabase (PostgreSQL with 67+ tables, 3700+ lines of generated types)
- **Styling**: Tailwind CSS 3 with custom brand/theme color palette
- **Icons**: lucide-react
- **Auth**: Supabase Auth with cookie-based sessions via `@supabase/ssr`
- **AI**: Anthropic Claude (content classification + translation)
- **Backend Functions**: Supabase Edge Functions (Deno runtime)
- **Deployment**: Vercel (Next.js) + Supabase (Edge Functions)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (metadata, HTML shell)
│   ├── globals.css                   # Tailwind base + custom styles
│   ├── sitemap.ts                    # Dynamic sitemap generation
│   ├── robots.ts                     # Robots.txt config
│   ├── (exchange)/                   # Public-facing site (route group)
│   │   ├── layout.tsx                # Exchange layout (Header, Footer, Language/Neighborhood providers)
│   │   ├── page.tsx                  # Homepage
│   │   ├── pathways/                 # 7 thematic pathway pages
│   │   ├── help/                     # "I Need Help" life situations
│   │   ├── officials/                # Elected officials + ZIP lookup
│   │   ├── services/                 # 211 services directory
│   │   ├── learn/                    # Learning paths
│   │   ├── content/[id]/             # Content detail page
│   │   ├── elections/                # Elections + voting
│   │   ├── policies/                 # Legislation tracking
│   │   ├── organizations/[id]/       # Org profiles
│   │   ├── neighborhoods/[id]/       # Neighborhood profiles
│   │   ├── explore/                  # Knowledge graph browse
│   │   ├── centers/[slug]/           # Center pages (Learning, Action, Resource, Accountability)
│   │   ├── guides/                   # Community guides
│   │   ├── search/                   # Global search
│   │   ├── dashboard-live/           # Live civic dashboard (AQI, weather, bayou)
│   │   ├── me/                       # User profile + settings
│   │   ├── login/ signup/            # Auth pages
│   │   └── auth/callback/route.ts    # OAuth callback
│   └── dashboard/                    # Admin dashboard (auth-protected)
│       ├── layout.tsx                # Dashboard layout (Sidebar, auth check)
│       ├── page.tsx                  # Overview stats
│       ├── review/                   # Content review queue
│       ├── content/                  # Published content management
│       ├── ingestion/                # Ingestion pipeline monitor
│       ├── submit/                   # URL submission + CSV upload
│       ├── translations/             # Translation coverage
│       ├── taxonomy/                 # Taxonomy browser
│       ├── knowledge-graph/          # Knowledge graph visualization
│       └── api-keys/                 # API key management
├── components/
│   ├── ui/                           # Shared UI (StatsCard, ThemePill, Modal, etc.)
│   ├── exchange/                     # Public site components (ContentCard, OfficialCard, etc.)
│   └── layout/                       # Layout components (Sidebar)
├── lib/
│   ├── constants.ts                  # THEMES, CENTERS, BRAND, PERSONAS, LANGUAGES
│   ├── contexts/
│   │   ├── LanguageContext.tsx        # Language switching (EN/ES/VI) with cookie persistence
│   │   └── NeighborhoodContext.tsx    # ZIP-based neighborhood awareness
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client (uses cookies)
│   │   └── database.types.ts         # Auto-generated types (3700+ lines, DO NOT edit)
│   ├── types/
│   │   ├── exchange.ts               # Public site types (derived from DB types)
│   │   └── dashboard.ts              # Admin dashboard types
│   └── data/
│       ├── exchange.ts               # Public data fetchers (30+ functions)
│       ├── dashboard.ts              # Admin data fetchers
│       ├── search.ts                 # Full-text search across all tables
│       ├── edge-functions.ts         # Edge function callers (classify, publish, etc.)
│       └── civic-dashboard.ts        # Live civic data fetchers
└── middleware.ts                     # Auth guard for /dashboard and /me routes
```

### Backend (Supabase Edge Functions)

```
supabase/functions/
├── _shared/                  # Shared auth helpers (3-tier: service_role > partner > neighbor > anon)
├── classify-content-v2/      # AI content classification (15 dimensions, Claude Sonnet)
├── publish-content/          # Move approved content to production + trigger translations
├── translate-content/        # EN → ES/VI translation (Claude, 6th-grade reading level)
├── api-ingest/               # Batch URL ingestion via API key
├── csv-upload/               # CSV batch classification
├── batch-classify/           # Discovery + bulk classification
├── sync-officials/           # Congress.gov + Google Civic API sync
├── sync-policies/            # Federal legislation sync
├── sync-sites/               # Distribution sites sync (HFB, JSON, CSV, WordPress)
├── backfill-v2/              # Classify unclassified DB records
├── ce-app/                   # Embedded SPA shell (legacy)
├── ce-config/                # Client config + utilities (legacy)
├── ce-{home,help,pathways,officials,dashboard,services}/  # Legacy SPA views
└── translate-all/            # Batch translation endpoint
```

### Other Directories

```
api/                          # Legacy Vercel serverless function (civic-dashboard)
scripts/translate-all.mjs     # Node.js batch translation script
docs/sprint-tracker.md        # Sprint progress tracker
supabase/migrations/          # SQL migrations
public/images/                # Static assets
```

## Architecture Patterns

### Data Flow: Content Ingestion Pipeline

```
URL/CSV Input → api-ingest / csv-upload / batch-classify
    → classify-content-v2 (Claude AI, 15 dimensions)
    → content_inbox (staging)
    → content_review_queue (all content requires manual review)
    → publish-content → content_published (live)
    → translate-content (Spanish, Vietnamese)
```

### Supabase Client Usage

- **Server Components** (default): Use `createClient()` from `@/lib/supabase/server` — reads cookies for auth
- **Client Components** (`'use client'`): Use `createClient()` from `@/lib/supabase/client` — browser client
- **Middleware**: Creates its own server client for auth checks
- All data fetching goes through functions in `src/lib/data/` — never query Supabase directly in components

### Route Groups

- `(exchange)` — Public-facing pages with Header/Footer/Language/Neighborhood providers
- `dashboard` — Admin pages protected by auth middleware + layout-level redirect

### Authentication

- Supabase Auth with cookie-based sessions
- Middleware protects `/dashboard/*` and `/me/*` routes
- Dashboard layout double-checks auth and redirects to `/login`
- Three-tier role system in Edge Functions: `service_role` > `partner` > `neighbor` > `anon`

### Internationalization

- Three languages: English (default), Spanish (`LANG-ES`), Vietnamese (`LANG-VI`)
- `LanguageContext` provides `useLanguage()` hook, persists choice in `lang` cookie
- Translations stored in `translations` table, fetched via `fetchTranslationsForTable()`
- All public-facing text simplified to 5th-6th grade reading level

### The Seven Pathways (Themes)

| ID | Name | Color | Slug |
|---|---|---|---|
| THEME_01 | Our Health | #e53e3e | our-health |
| THEME_02 | Our Families | #dd6b20 | our-families |
| THEME_03 | Our Neighborhood | #d69e2e | our-neighborhood |
| THEME_04 | Our Voice | #38a169 | our-voice |
| THEME_05 | Our Money | #3182ce | our-money |
| THEME_06 | Our Planet | #319795 | our-planet |
| THEME_07 | The Bigger We | #805ad5 | the-bigger-we |

### Four Centers

| Center | Question | Slug |
|---|---|---|
| Learning | How can I understand? | learning |
| Action | How can I help? | action |
| Resource | What's available to me? | resources |
| Accountability | Who makes decisions? | accountability |

## Coding Conventions

### TypeScript

- Strict mode enabled; zero TypeScript errors expected
- Path alias: `@/*` maps to `./src/*`
- Types derived from auto-generated `database.types.ts` — use `Tables<'table_name'>` pattern
- Exchange types defined in `src/lib/types/exchange.ts`
- Dashboard types defined in `src/lib/types/dashboard.ts`

### Components

- Server Components by default; add `'use client'` only when needed (interactivity, hooks)
- Client components use suffix pattern: `FooClient.tsx` alongside server `page.tsx`
- Icons from `lucide-react` only
- All Tailwind — no CSS modules or styled-components

### Styling

- Tailwind CSS with custom brand colors defined in `tailwind.config.ts`
- Use `brand-*` prefix for brand colors: `bg-brand-bg`, `text-brand-text`, `border-brand-border`
- Use `theme-*` prefix for pathway colors: `bg-theme-health`, `text-theme-voice`
- Use `sidebar-*` prefix for dashboard sidebar: `bg-sidebar-bg`, `hover:bg-sidebar-hover`
- System font stack (no custom fonts loaded)

### Data Fetching

- All Supabase queries live in `src/lib/data/*.ts` — not in components
- Server-side data fetching in page components using async functions
- Data fetchers return plain arrays/objects, handle nulls with `?? []` / `?? 0`
- Edge function calls go through `src/lib/data/edge-functions.ts`

### Content Classification (15 Dimensions)

Every classified piece of content includes:
1. `theme_primary` — Primary pathway
2. `theme_secondary` — Secondary pathways
3. `focus_area_ids` — Specific topic areas
4. `sdg_ids` — UN Sustainable Development Goals
5. `center` — Learning/Action/Resource/Accountability
6. `resource_type_id` — Content type
7. `audience_segment_ids` — Target demographics
8. `life_situation_ids` — Related life situations
9. `service_cat_ids` — Service categories
10. `title_6th_grade` — Simplified title
11. `summary_6th_grade` — Simplified summary
12. `action_items` — Actionable URLs (donate, volunteer, apply, etc.)
13. `confidence` — Classification confidence score (0-1)
14. `reasoning` — AI reasoning for classification
15. SDOH/NTEE/AIRS codes inherited from focus areas

## Environment Variables

Required in `.env.local` (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous/public key
```

Edge Functions additionally require (set in Supabase dashboard):
- `SUPABASE_SERVICE_ROLE_KEY` — Full database access
- `ANTHROPIC_API_KEY` — Claude API for classification/translation
- `CONGRESS_API_KEY` — Congress.gov API
- `GOOGLE_CIVIC_API_KEY` — Google Civic Information API

## Key Files to Know

| File | Purpose |
|---|---|
| `src/lib/constants.ts` | THEMES, CENTERS, BRAND colors, PERSONAS, LANGUAGES |
| `src/lib/supabase/database.types.ts` | Auto-generated DB types (DO NOT edit manually) |
| `src/lib/data/exchange.ts` | All public-site data fetchers |
| `src/lib/data/dashboard.ts` | All admin dashboard data fetchers |
| `src/middleware.ts` | Auth route protection |
| `src/app/(exchange)/layout.tsx` | Public layout with providers |
| `src/app/dashboard/layout.tsx` | Admin layout with sidebar + auth |
| `tailwind.config.ts` | Custom color palette definition |
| `docs/sprint-tracker.md` | Development progress tracker |

## Database Notes

- 67+ tables in Supabase PostgreSQL
- Types auto-generated into `database.types.ts` (3700+ lines) — regenerate with Supabase CLI, never edit manually
- Content pipeline tables: `content_inbox` → `content_review_queue` → `content_published`
- All content requires manual review before publishing (no auto-approval path)
- Translations stored in separate `translations` table keyed by `(content_type, content_id, language_id, field_name)`
- `focus_area_ids` fields are sometimes TEXT[] arrays and sometimes comma-separated TEXT — check the specific table

## Edge Function Conventions

- Runtime: Deno (in `supabase/functions/`)
- Shared auth in `_shared/auth.ts` — always verify caller role
- API key auth in `_shared/api-key-auth.ts` — SHA-256 hashed, daily rate limits
- Rate limiting: 1-5 second delays between external API calls
- Claude models used: `claude-sonnet-4-20250514` (classification), `claude-haiku-4-5-20251001` (backfill/translation)
- All operations logged to `ingestion_log` table for audit trail

## Common Tasks

### Adding a new public page
1. Create `src/app/(exchange)/your-page/page.tsx` (server component)
2. Add data fetcher in `src/lib/data/exchange.ts`
3. Add types if needed in `src/lib/types/exchange.ts`
4. If interactive, create a `YourPageClient.tsx` client component alongside the page

### Adding a new dashboard page
1. Create `src/app/dashboard/your-page/page.tsx`
2. Add data fetcher in `src/lib/data/dashboard.ts`
3. Add server actions in `src/app/dashboard/your-page/actions.ts` if needed
4. Dashboard is auth-protected automatically by middleware + layout

### Adding a new component
- Shared UI → `src/components/ui/`
- Public exchange → `src/components/exchange/`
- Use Tailwind classes with brand color tokens
- Icons from `lucide-react` only
