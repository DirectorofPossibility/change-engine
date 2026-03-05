# The Change Engine — Technical Reference

## Project Identity

- **Name**: The Change Engine
- **Package name**: `the-change-engine`
- **Domain**: https://www.changeengine.us
- **Description**: Civic platform connecting Houston residents with resources, services, and civic participation opportunities

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| UI | React | 18.x |
| Styling | Tailwind CSS | 3.x |
| Fonts | DM Sans (body) + DM Serif Display (headings) | Google Fonts |
| Maps | Leaflet + react-leaflet + OpenStreetMap | 1.9.x |
| Icons | lucide-react | latest |
| Backend | Supabase (Postgres, Auth, Edge Functions, Storage) | — |
| AI | Anthropic Claude API (content classification, enrichment) | — |
| Hosting | Vercel | — |
| Package Manager | npm | — |

## Repository & Deployment

- **GitHub repo**: `DirectorofPossibility/change-engine`
- **Production branch**: `master` — pushes here auto-deploy to Vercel
- **Secondary branch**: `main` — kept in sync with master, do NOT use as production
- **Vercel project**: `change-engine` (ID: `prj_rrgcqxXAkULKeWltI1uflmbUTHl3`)
- **Vercel team**: `team_oz4pMLLYSmL8q9tdf6dX0lJM`
- **Local clone directory**: `~/change-lab-api` (legacy name, repo is `change-engine`)

### Deployment Flow

```
local master → git push origin master → GitHub (DirectorofPossibility/change-engine) → Vercel auto-deploy → www.changeengine.us
```

## Supabase

- **Project ID**: `xesojwzcnjqtpuossmuv`
- **URL**: `https://xesojwzcnjqtpuossmuv.supabase.co`
- **Edge Functions**: `supabase/functions/` (Deno runtime)
- **Migrations**: `supabase/migrations/`
- **Note**: DNS does not resolve from the dev machine — use Supabase MCP tools for DB operations

## Project Structure

```
change-lab-api/                         # Local clone (repo name: change-engine)
├── src/
│   ├── app/
│   │   ├── (exchange)/                 # Public-facing route group
│   │   │   ├── (pages)/               # All public pages (nested route group)
│   │   │   ├── auth/                   # Auth callback
│   │   │   ├── layout.tsx              # Exchange layout (header, footer, sidebar)
│   │   │   └── page.tsx                # Homepage
│   │   ├── api/                        # Next.js API routes
│   │   │   ├── classify/              # Content classification
│   │   │   ├── cron/                  # Scheduled jobs
│   │   │   ├── enrich/                # Content enrichment
│   │   │   ├── enrich-entity/         # Entity enrichment
│   │   │   ├── ingest/                # Content ingestion
│   │   │   └── translate/             # Translation
│   │   ├── dashboard/                  # Admin dashboard (auth-protected)
│   │   ├── globals.css
│   │   ├── layout.tsx                  # Root layout
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── exchange/                   # Public UI components
│   │   ├── layout/                     # Sidebar, shared layout
│   │   ├── maps/                       # Leaflet map components
│   │   └── ui/                         # Generic UI (Modal, Badge, etc.)
│   ├── lib/
│   │   ├── api-auth.ts                 # API key authentication
│   │   ├── constants.ts                # Themes, focus areas, languages, SDGs
│   │   ├── contexts/                   # React contexts (Language, Neighborhood)
│   │   ├── data/                       # Data fetching layer
│   │   │   ├── exchange.ts             # Primary data access (NOT db.ts)
│   │   │   ├── dashboard.ts            # Dashboard queries
│   │   │   ├── civic-dashboard.ts      # Civic dashboard queries
│   │   │   ├── edge-functions.ts       # Edge function invocations
│   │   │   └── search.ts              # Full-text search
│   │   ├── i18n.ts                     # Internationalization strings
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   ├── server.ts              # Server Supabase client
│   │   │   └── database.types.ts      # Generated DB types
│   │   └── types/
│   │       ├── exchange.ts            # Public-facing types
│   │       └── dashboard.ts           # Dashboard types
│   └── middleware.ts                   # Auth session refresh, route protection
├── supabase/
│   ├── functions/                      # Edge functions (Deno)
│   │   ├── _shared/                   # Shared auth, CORS helpers
│   │   ├── classify-content-v2/       # AI content classification
│   │   ├── publish-content/           # Publish workflow
│   │   ├── translate-content/         # Single translation
│   │   ├── translate-all/             # Batch translation
│   │   ├── sync-officials/            # Civic data sync
│   │   ├── sync-policies/             # Policy sync
│   │   ├── sync-polling-places/       # Polling place sync
│   │   ├── rss-proxy/                 # RSS feed proxy
│   │   ├── api-ingest/                # External API ingestion
│   │   └── ... (others)
│   └── migrations/                    # SQL migrations
├── public/
│   ├── geo/                           # GeoJSON files
│   └── images/                        # Static images, SVGs
├── knowledge-mesh/                    # DEPRECATED — standalone prototype, superseded by main app
├── vercel.json                        # Vercel config (crons, headers)
├── next.config.js                     # Next.js config
├── tailwind.config.ts                 # Tailwind config (brand colors, theme colors)
├── tsconfig.json                      # TypeScript config
└── package.json
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xesojwzcnjqtpuossmuv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SECRET_KEY=<service role key>
ANTHROPIC_API_KEY=<claude api key>
```

## Local Development

```bash
source ~/.nvm/nvm.sh && nvm use 18
npm install
npm run dev
```

**Note**: System Node.js is incompatible with this macOS version. Always use NVM with Node 18.

## Build & Deploy

```bash
# Local build test
source ~/.nvm/nvm.sh && nvm use 18 && npm run build

# Deploy (auto on push)
git push origin master
```

## Unified Intake Pipeline

**Single entry point: `POST /api/intake`** — routes any data type through classification.

### Intake Modes
| Type | Payload | What Happens |
|------|---------|-------------|
| `content` | `{ urls: [...] }` | Scrape → classify-content-v2 → review queue → publish |
| `officials` | `{ items: [...] }` | Upsert elected_officials → auto-classify → junction tables |
| `policies` | `{ items: [...] }` | Upsert policies → auto-classify → junction tables |
| `services` | `{ items: [...] }` | Upsert services_211 → auto-classify → junction tables |
| `organizations` | `{ items: [...] }` | Upsert organizations → auto-classify → junction tables |
| `opportunities` | `{ items: [...] }` | Upsert opportunities → auto-classify → junction tables |
| `rss_feed` | `{ feed_url, feed_name }` | Add to rss_feeds → immediate poll → classify |
| `sync` | `{ source: "all"\|"google_civic"\|"legistar"\|"texas"\|"rss" }` | Trigger data sync from external APIs |
| `classify` | `{ table, limit }` | Sweep unclassified entities in any table |

### Daily Cron Schedule (CT)
| Time | Cron | What |
|------|------|------|
| 1 AM | `batch-translate` | Translate untranslated content → ES, VI |
| 3 AM | `poll-rss` | Poll all active RSS feeds → classify new items |
| 6 AM | `sync-polling-places` | Refresh voter locations |
| 7 AM | `sync-city-houston` | Legistar API → officials + policies + classify |
| 8 AM | `sync-officials` | Google Civic + Congress → federal/state officials + ZIP districts + classify |
| 9 AM | `sync-state-texas` | TLO + Open States → officials + policies + classify |
| 11 AM | `classify-pending` | Sweep ALL entity tables for unclassified items |

### Classification Pipeline
1. All data goes through `classify-content-v2` (content) or `enrich-entity` (entities)
2. AI classifies across **16 taxonomy dimensions** (themes, focus areas, SDGs, SDOH, NTEE, AIRS, centers, audiences, life situations, service categories, skills, time commitments, action types, gov levels, content type, geographic scope)
3. Junction tables populated automatically for every entity type
4. Nothing is auto-published — content goes to `needs_review` in `/dashboard/review`
5. Translations run nightly for published content (ES + VI)

### Data Sources
- **RSS feeds** → `rss_feeds` table → `rss-proxy` edge function → content pipeline
- **Google Civic API** → `sync-officials` → ZIP→district mapping + officials
- **Congress.gov API** → `sync-officials` → federal officials (TX)
- **Legistar API** → `sync-city-houston` → Houston council + ordinances
- **Texas Legislature** → `sync-state-texas` → state officials + bills
- **Manual URLs** → `/api/ingest` or `/api/intake` → content pipeline
- **External APIs** → `/api/intake` with entity items → upsert + classify

## Translation System

- **Table**: `translations` keyed by `translation_id`
- **Fields**: `content_type`, `content_id`, `language_id`, `field_name`
- **Language IDs**: `LANG-ES` (Spanish), `LANG-VI` (Vietnamese)
- **Field names**: `title`, `summary`
- **Join**: `translations.content_id` = `content_published.inbox_id`

## Routing Rules (IMPORTANT — prevents 404s)

1. **Every `href` in a Link or `<a>` tag must point to an existing `page.tsx` route.** Before adding a link to `/foo/bar`, verify that `src/app/(exchange)/(pages)/foo/bar/page.tsx` (or `[slug]/page.tsx`, `[id]/page.tsx`) exists. If it doesn't, create the page first.
2. **`content_published.id` (UUID) is the routing key for content.** Always use `item.id` in hrefs like `/content/{id}`. Never use `inbox_id` for routing — `inbox_id` is only for translation lookups and pipeline joins.
3. **`inbox_id` vs `id` rule:** When building component props (ShelfItem, ContentCard, etc.), if a field is used to construct a URL, it MUST use the entity's primary key (`id`, `service_id`, `official_id`, etc.) — never a foreign key like `inbox_id`.
4. **ContentCard accepts an `href` prop** for explicit routing override. Use it when the card's `id` prop doesn't match the routing key (e.g., when `id` is set to `inbox_id` for translation lookup).

## Key Design Principles

- **Asset-based language** — focus on strengths and opportunities, not deficits
- Serif typography for headings, elegant and graceful design
- Images as thumbnails where available, colored headers as fallback
- Brand palette: warm earth tones (`#F5F1EB` bg, `#C75B2A` accent, `#2C2C2C` text)
- 7 theme colors for pathways (health, families, neighborhood, voice, money, planet, bigger-we)
