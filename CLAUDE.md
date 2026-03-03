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

## Content Pipeline

1. Content is ingested via `/api/ingest` or Supabase edge functions
2. All content goes through `classify-content-v2` — nothing is auto-approved
3. Classification maps content onto knowledge graph (themes, focus areas, SDGs)
4. Content rewrites target 6th-grade reading level
5. Admin reviews in `/dashboard/review` → publishes via `publish-content`
6. Published content links to original source URL in the Wayfinder
7. Translations handled by `translate-content` / `translate-all` edge functions

## Translation System

- **Table**: `translations` keyed by `translation_id`
- **Fields**: `content_type`, `content_id`, `language_id`, `field_name`
- **Language IDs**: `LANG-ES` (Spanish), `LANG-VI` (Vietnamese)
- **Field names**: `title`, `summary`
- **Join**: `translations.content_id` = `content_published.inbox_id`

## Key Design Principles

- **Asset-based language** — focus on strengths and opportunities, not deficits
- Serif typography for headings, elegant and graceful design
- Images as thumbnails where available, colored headers as fallback
- Brand palette: warm earth tones (`#F5F1EB` bg, `#C75B2A` accent, `#2C2C2C` text)
- 7 theme colors for pathways (health, families, neighborhood, voice, money, planet, bigger-we)
