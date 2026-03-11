# Change Engine — Full Project Audit

> Generated 2026-03-11. This document is intended for an AI performing a full frontend reskin. It contains everything needed to understand what exists, how data flows, and what the current design system looks like.

---

## Table of Contents

1. [Stack & Infrastructure](#1-stack--infrastructure)
2. [Project Structure](#2-project-structure)
3. [Every Route in app/](#3-every-route-in-app)
4. [Every Component in components/](#4-every-component-in-components)
5. [Supabase Connection & Data Layer](#5-supabase-connection--data-layer)
6. [Data Shapes by Page](#6-data-shapes-by-page)
7. [Styling & Design System](#7-styling--design-system)
8. [Unusual, Broken, or Incomplete](#8-unusual-broken-or-incomplete)

---

## 1. Stack & Infrastructure

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 18.3 |
| Styling | Tailwind CSS 3.4 + custom tokens |
| Fonts | DM Sans (body), DM Serif Display (headings), Caveat (handwriting), Space Mono (mono/labels) |
| Maps | Leaflet 1.9 + react-leaflet 4.2 + react-leaflet-cluster (OpenStreetMap tiles) |
| Icons | lucide-react |
| Database | Supabase (PostgreSQL + Auth + Edge Functions + Storage) |
| AI | Anthropic Claude API (classification, enrichment, translation, chat) |
| Hosting | Vercel (auto-deploy from `master` branch) |
| Domain | www.changeengine.us |
| i18n | Custom (EN, ES, VI) — cookie-based language, `translations` table |
| Auth | Supabase Auth (email + OAuth), cookie sessions, middleware refresh |
| State | Minimal — React Context (LanguageContext, NeighborhoodContext) + cookies. No Redux/Zustand. |

### Key Config Files

- `package.json` — dependencies
- `tsconfig.json` — strict mode, `@/*` → `./src/*` path alias
- `next.config.js` — image remotePatterns, legacy redirects
- `tailwind.config.ts` — full design token system (see Section 7)
- `vercel.json` — 14 cron jobs, CORS headers
- `src/middleware.ts` — auth session refresh, route protection for `/dashboard/*` and `/me/*`

---

## 2. Project Structure

```
src/
├── app/
│   ├── (exchange)/              # Public site (layout: Header + Footer + providers)
│   │   ├── (pages)/             # All public pages (80+ routes)
│   │   ├── layout.tsx           # LanguageProvider, NeighborhoodProvider, Schema.org JSON-LD
│   │   └── page.tsx             # Homepage
│   ├── (splash)/                # Auth pages (login, signup, reset-password)
│   ├── api/                     # 52 API route handlers
│   ├── auth/                    # OAuth callback + email confirm
│   ├── dashboard/               # Admin (39 pages, auth + role gated)
│   ├── design1/, design2/       # Legacy A/B prototypes (inactive, layout toggle removed)
│   ├── layout.tsx               # Root: fonts, metadata
│   ├── error.tsx                # Global error boundary
│   └── not-found.tsx            # Global 404
│
├── components/
│   ├── exchange/                # 155+ public UI components
│   ├── dashboard/               # Admin components
│   ├── maps/                    # 14 Leaflet map components
│   ├── layout/                  # DashboardHeader, Sidebar
│   └── ui/                      # Generic: Modal, SlidePanel, badges, cards
│
├── lib/
│   ├── data/                    # 30 data-access modules (Supabase queries)
│   ├── supabase/
│   │   ├── client.ts            # Browser client factory
│   │   ├── server.ts            # Server client + service role client
│   │   └── database.types.ts    # Auto-generated types (8,276 lines, 200+ tables)
│   ├── types/
│   │   ├── exchange.ts          # Public-facing types
│   │   └── dashboard.ts         # Admin types
│   ├── contexts/                # LanguageContext, NeighborhoodContext
│   ├── constants.ts             # Themes, centers, brand, languages, geo layers
│   ├── i18n.ts                  # UI string translations
│   └── ...                      # Auth, feature flags, embeddings, etc.
│
└── middleware.ts
```

---

## 3. Every Route in app/

### 3a. Root Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout. Loads Google Fonts (DM Sans, DM Serif Display, Caveat, Space Mono). Sets metadata base URL. Reads `lang` cookie. Server component. |
| `app/error.tsx` | Global error boundary. Client component. Styled retry button. |
| `app/not-found.tsx` | Global 404. Link back to homepage. |
| `app/sitemap.ts` | Dynamic sitemap generation. |

### 3b. Auth Pages — `(splash)/`

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/(splash)` | `page.tsx` | Server | Splash/landing wrapper |
| `/login` | `login/page.tsx` | Client | Email + password signin. Role-based redirect after auth. |
| `/signup` | `signup/page.tsx` | Client | Registration: name, email, password (8+ chars, uppercase, number), ZIP, language, 3 policy agreements. Creates `user_profiles`. |
| `/reset-password` | `reset-password/page.tsx` | Client | Email form → Supabase password reset link. |

### 3c. Public Pages — `(exchange)/(pages)/`

Layout: `(exchange)/layout.tsx` — wraps with LanguageProvider, NeighborhoodProvider, Header, Footer, ElectionBanner, Schema.org JSON-LD.

#### Static / Info Pages

| Route | Purpose | Data |
|-------|---------|------|
| `/about` | About page | Static + i18n |
| `/accessibility` | Accessibility statement | Static |
| `/account-locked` | Locked account notice | Static |
| `/action` | Action hub | Static |
| `/coming-soon` | Placeholder | Static |
| `/contact` | Contact form | Static |
| `/faq` | FAQ accordion | Static FAQ data |
| `/glossary` | Glossary list | Static |
| `/governance` | Governance diagram | Static |
| `/help` | Help categories | Static |
| `/help/[slug]` | Help detail | Dynamic URL param |
| `/manual` | Manual/guide | Static |
| `/privacy` | Privacy policy | Static |
| `/terms` | Terms of service | Static |
| `/donate` | Donation landing | Static |
| `/exchange` | Platform intro | Static |

#### Data-Driven Collection Pages (Server, ISR revalidate: 300s unless noted)

| Route | Data Source | Key Tables | Components |
|-------|-----------|------------|------------|
| `/services` | `getServices()` | services_211, organizations | IndexPageHero, ServicesClient, IndexWayfinder |
| `/services/[id]` | Direct query | services_211, organizations, related services | Service detail, SingleLocationMap, org card, library nuggets |
| `/officials` | `getOfficials()` | elected_officials, official_profiles | IndexPageHero, OfficialsPageClient (revalidate: 86400s) |
| `/officials/[id]` | Direct query | elected_officials, official_profiles, policies, focus_areas, committees | Official detail, OfficialDistrictMap, vote records (revalidate: 86400s) |
| `/officials/lookup` | `getOfficialsByZip()` | zip_codes → districts → officials | ZIP form, officials grid |
| `/organizations` | `getOrganizations()` | organizations | IndexPageHero, OrganizationsClient |
| `/organizations/[id]` | Direct query | organizations, services_211, events, content_published | Org detail, services grid, news |
| `/opportunities` | `getOpportunities()` | opportunities | IndexPageHero, OpportunitiesClient |
| `/opportunities/[id]` | Direct query | opportunities, organizations | Detail, org info, library nuggets |
| `/policies` | `getPolicies()` | policies | IndexPageHero, PoliciesClient |
| `/policies/[id]` | Direct query | policies, elected_officials, policy_geography | Detail, sponsor info, jurisdiction map |
| `/elections` | `getElections()` | elections | IndexPageHero, ElectionsClient |
| `/elections/[id]` | Direct query | elections, ballot_items, candidates | Detail, ballot, candidate grid |
| `/candidates` | `getCandidates()` | candidates | IndexPageHero, CandidatesClient |
| `/candidates/[id]` | Direct query | candidates, ballot_items | Bio, positions, ballot items |
| `/events` | `getEvents()` | events, content_published | IndexPageHero, EventsClient |
| `/events/[id]` | Direct query | events, organizations | Detail, date/location/registration |
| `/agencies` | `getAgencies()` | agencies | IndexPageHero, AgenciesClient |
| `/agencies/[id]` | Direct query | agencies, services_211 | Detail, related services |
| `/benefits` | `getBenefits()` | benefit_programs | IndexPageHero, BenefitsClient |
| `/benefits/[id]` | Direct query | benefit_programs | Detail, eligibility, how to apply |
| `/municipal-services` | `getMunicipalServices()` | municipal_services | IndexPageHero, grid |
| `/municipal-services/[id]` | Direct query | municipal_services | Detail, availability, contact |
| `/neighborhoods` | `getNeighborhoods()` | neighborhoods | IndexPageHero, NeighborhoodsClient, map |
| `/neighborhoods/[id]` | Direct query | neighborhoods, services_211, elected_officials, events | Hood detail, map, stats, service grid |
| `/super-neighborhoods` | `getSuperNeighborhoods()` | super_neighborhoods | IndexPageHero, grid |
| `/super-neighborhoods/[id]` | Direct query | super_neighborhoods, neighborhoods | Detail, child hoods, stats |
| `/tirz` | `getTirz()` | tirz_zones | IndexPageHero, grid |
| `/tirz/[id]` | Direct query | tirz_zones | Detail, projects |
| `/foundations` | `getFoundations()` | foundations | FoundationsGrid |
| `/foundations/[id]` | Direct query | foundations | Detail, grants |
| `/news` | Recent content as news | content_published (articles/reports) | News grid |
| `/resources` | `getResources()` | mixed resources | IndexPageHero, resource grid |
| `/stories` | Featured stories | content_published | StoriesGrid |
| `/stories/[id]` | Direct query | content_published | Story detail |
| `/content/[id]` | Direct query | content_published, junctions | Content detail, taxonomy tags, library nuggets |
| `/ballot` | `getBallotItems()` | ballot_items | Ballot grid, voter info |
| `/polling-places` | `getPollingPlaces()` | voting_locations | Map-based finder |
| `/call-your-senators` | Officials data | elected_officials | Call script generator |
| `/data` | Dataset export | Mixed | DataExport, download links |
| `/goodthings` | User submissions | content_published | GoodThingsGrid |
| `/for/[slug]` | Audience personas | audience_segments → content | Persona detail, content grid |
| `/personas` | Persona listing | Static persona configs | Persona cards |

#### Learning & Knowledge Pages

| Route | Data Source | Key Tables |
|-------|-----------|------------|
| `/pathways` | `getPathways()` | themes + content counts | 7 pathway cards |
| `/pathways/[slug]` | Learning paths by theme | learning_paths, content_published | Pathway detail, content grid |
| `/learning-paths` | `getLearningPaths()` | learning_paths | Grid of paths |
| `/learning-paths/[id]` | Direct query | learning_paths, modules | Path detail, module grid |
| `/learn` | `getLearningPaths()` | learning_paths | Path grid |
| `/learn/[id]` | Direct query | learning_paths or content_published | Module detail |
| `/guides` | `getGuides()` | guides | Guide grid by category |
| `/guides/[slug]` | `getGuideBySlug()` | guides | Step-by-step detail |
| `/centers` | Static centers | — | 4 center cards |
| `/centers/[slug]` | Center by slug | centers, content_published | Center hub, featured content |
| `/library` | `getLibraryDocuments()` | kb_documents | Categories, featured docs |
| `/library/doc/[id]` | Direct query | kb_documents | Doc detail, download |
| `/library/category/[slug]` | By category | kb_documents | Category grid + search |
| `/library/chat` | Chat interface | kb_chat_sessions | Chat UI (client component) |
| `/explore` | Knowledge base hub | focus_areas, sdgs | Taxonomy intro |
| `/explore/focus/[id]` | Focus area detail | focus_areas, content | Related content grid |
| `/explore/knowledge-base` | Full taxonomy | All taxonomy tables | TaxonomyBrowser |
| `/adventures` | `getAdventures()` | Static adventure data | Adventure cards |
| `/adventures/[slug]` | Adventure detail | Static | Step-by-step UI |
| `/collections` | User collections | user_collections (dynamic) | CollectionsClient |
| `/collections/[id]` | Collection detail | user_collections | Item grid |
| `/quiz*` | Quiz routes | quizzes | Quiz list + interactive |

#### Interactive / Dynamic Pages (force-dynamic)

| Route | Purpose | Notes |
|-------|---------|-------|
| `/search` | Full-text across 8 entity types | `searchAll(query)` — parallel batch translations |
| `/geography` | Interactive map with GeoJSON layers | Leaflet + district boundaries |
| `/calendar` | Full-month event calendar | Merges events + civic_calendar + opportunities |
| `/compass` | Personalized pathway guidance | Needs auth context |
| `/chat` | AI chat (Chance bot) | Edge function backend |
| `/knowledge-graph` | Force-directed graph | Interactive exploration |
| `/dashboard-live` | Live stats preview | Client component |
| `/bookshelf` | Saved library items | Authenticated |
| `/me` | User dashboard | Profile, badges, learning progress |
| `/me/settings` | Profile edit | Name, ZIP, language, email prefs |
| `/me/submit` | Content submission | Multi-step form |

### 3d. Dashboard Pages — `/dashboard/`

Protected by auth guard in layout. Redirects unauthenticated → `/login?redirect=/dashboard`. Role-gated (admin/partner/neighbor).

| Route | Data Source | Purpose |
|-------|-----------|---------|
| `/dashboard` | `getPipelineStats()`, `getReviewStatusBreakdown()`, `getContentByPathway()`, `getContentByCenter()`, `getIngestionLog()` | Stats cards, PipelineFlow, charts, activity log |
| `/dashboard/review` | `getReviewQueue()` | Content review: confidence, taxonomy, approve/reject |
| `/dashboard/content` | `getPublishedContent()` | Published content table, edit links |
| `/dashboard/ingestion` | `getIngestionQueue()` | Pipeline status, manual URL entry |
| `/dashboard/policies` | `getPolicies()` | Policy review table |
| `/dashboard/translations` | `getTranslations()` | Translation queue, verify, export |
| `/dashboard/taxonomy` | `getTaxonomy()` | Browse/edit categories |
| `/dashboard/feeds` | `getRssFeeds()` | RSS feed management |
| `/dashboard/library` | Library docs admin | Upload, organize, feature |
| `/dashboard/users` | `getUsers()` | User management, roles |
| `/dashboard/api-keys` | `getApiKeys()` | API key lifecycle |
| `/dashboard/analytics` | Page views, engagement | Charts: traffic, top pages |
| `/dashboard/fidelity` | `getFidelityOverview()` | Data quality: completeness %, missing fields |
| `/dashboard/edits` | Edit history | Audit log |
| `/dashboard/pipeline` | Pipeline stats | Visualization, counts by stage |
| `/dashboard/knowledge-graph` | Graph stats | Metrics, rebuild |
| `/dashboard/graph-explorer` | Force-directed graph | Interactive visualization |
| `/dashboard/graph-coverage` | Coverage analysis | % by entity type, gaps |
| `/dashboard/graphs` | All graphs | Browse generated graphs |
| `/dashboard/promotions` | Featured content admin | Set banners, promos |
| `/dashboard/quotes` | Quote management | Add/edit/delete quotes |
| `/dashboard/submit` | Content submission form | URL, title, description |
| `/dashboard/bookshelf` | Saved docs | Personal |
| `/dashboard/circles` | Community groups | Create/join/manage |
| `/dashboard/preferences` | Email frequency, topics | User prefs |
| `/dashboard/linkedin` | LinkedIn integration | Partner only |
| `/dashboard/manual` | Bulk data entry | CSV/JSON import |
| `/dashboard/utilities` | Admin utilities | Bulk ops, cleanup, cache |
| `/dashboard/tools-guides` | Partner tools | Featured guides |
| `/dashboard/partner` | Partner portal home | Links to guides, events, org |
| `/dashboard/partner/guides` | Partner guides list | CRUD |
| `/dashboard/partner/guides/new` | New guide form | Create |
| `/dashboard/partner/guides/[id]` | Edit guide | Update |
| `/dashboard/partner/events` | Partner events list | CRUD |
| `/dashboard/partner/events/new` | New event form | Create |
| `/dashboard/partner/events/[id]` | Edit event | Update |
| `/dashboard/partner/organization` | Org profile edit | Subscription, analytics |

### 3e. API Routes — `/api/`

#### Admin (require API key via `validateApiRequest`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ingest` | POST | Scrape URLs or accept pre-scraped items (max 25 URLs, 10 items) |
| `/api/classify` | POST | Batch classification (max 50 items) |
| `/api/translate` | POST | Batch translation to ES + VI (max 50 per table) |
| `/api/enrich-entity` | POST | Single entity AI enrichment |
| `/api/enrich` | POST | Batch enrichment (max 20 items) |
| `/api/admin/edit-entity` | PATCH | Update entity with audit log |
| `/api/admin/get-entity` | GET | Full entity + relations |
| `/api/admin/review-edit` | POST | Submit edit for peer review |
| `/api/admin/feeds/poll` | POST | Manual RSS poll |
| `/api/admin/feeds` | GET/POST | Feed CRUD |
| `/api/admin/sync-elections` | POST | Manual election sync |

#### Public (no auth)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/search-quick` | GET | Typeahead autocomplete (min 3 chars, top 20) |
| `/api/map-markers` | GET | Map markers by type/bbox/zoom |
| `/api/map-markers/detail` | GET | Single marker popup data |
| `/api/breakdown` | GET | Constituency breakdown by ZIP/district |
| `/api/geocode` | GET | Forward/reverse geocode |
| `/api/good-things` | GET | User success stories |
| `/api/calendar.ics` | GET | iCalendar export |

#### Other

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/feedback` | POST | User feedback/bug reports |
| `/api/intake` | POST | Alternative unified intake |
| `/api/neighbor-submit` | POST | Public content submission |
| `/api/role-request` | POST | Role upgrade request |
| `/api/translate-page` | POST | Client-side page translation |
| `/api/library/upload` | POST | Doc upload to library |
| `/api/library/search` | GET | Full-text library search |
| `/api/library/chat` | POST | Chat with library context |
| `/api/library/process` | POST | Process uploaded doc |
| `/api/library/vote` | POST | Upvote library doc |
| `/api/dashboard/policy-publish` | POST | Publish policy from queue |

#### Cron Jobs (Vercel Crons, require cron secret)

| Route | Schedule (CT) | Purpose |
|-------|--------------|---------|
| `/api/cron/batch-translate` | 1 AM | Translate untranslated → ES, VI |
| `/api/cron/poll-rss` | 3 AM | Poll RSS feeds → classify |
| `/api/cron/sync-federal-spending` | 5 AM Mon | USAspending (Harris County) |
| `/api/cron/sync-elections` | 5:30 AM Mon | TX SOS + FEC + Google Civic |
| `/api/cron/sync-polling-places` | 6 AM | Polling locations |
| `/api/cron/sync-city-houston` | 7 AM | Legistar → Houston |
| `/api/cron/sync-county-harris` | 8 AM | Legistar → Harris County |
| `/api/cron/sync-officials` | 9 AM | Google Civic + Congress |
| `/api/cron/sync-state-texas` | 10 AM | TLO + Open States |
| `/api/cron/classify-pending` | 11 AM | Sweep unclassified entities |
| `/api/cron/rewrite-descriptions` | 2 AM | AI rewrite to 5th/6th grade |
| `/api/cron/send-reminders` | 9 AM | Email reminders |
| `/api/cron/retry-failed` | 6 PM | Retry failed jobs |
| `/api/cron/crawl-orgs` | Periodic | Crawl org websites |

---

## 4. Every Component in components/

### 4a. `components/ui/` — Generic UI (11 files)

| Component | Type | Props | Renders |
|-----------|------|-------|---------|
| `Modal` | Client | `{ open, onClose, title?, children }` | Centered overlay dialog. Focus trap, Escape dismiss, backdrop click. Body scroll lock. |
| `SlidePanel` | Client | `{ open, onClose, title?, children }` | Right-aligned slide-in panel. Same a11y as Modal. Drag handle. |
| `StatsCard` | Server | `{ label, value, icon?, className? }` | Label + formatted number + optional icon. |
| `PipelineFlow` | Server | `{ stats, breakdown }` | 3-column flow: Inbox → Review → Published. Color-coded. |
| `StatusBadge` | Server | `{ status }` | Colored dot + status label (auto_approved, pending, flagged, etc.) |
| `ConfidenceBadge` | Server | `{ confidence }` | Percentage badge. Green ≥80%, yellow 50-79%, red <50%. |
| `ThemePill` | Server | `{ themeId, size?, linkable? }` | Colored dot + pathway name. Optional link to `/pathways/{slug}`. |
| `CenterBadge` | Server | `{ center, showQuestion?, linkable? }` | Colored dot + center name. Optional link. |
| `TierBadge` | Server | `{ tier }` | Data completeness tier indicator. |
| `SDGBadge` | Server | `{ sdgNumber, sdgName, sdgColor, linkToExplore? }` | SDG indicator with number + name. |
| `SDOHBadge` | Server | `{ sdohCode, sdohName, sdohDescription?, linkToExplore? }` | SDOH indicator with green left border. |

### 4b. `components/layout/` — Dashboard Layout (2 files)

| Component | Type | Props | Renders |
|-----------|------|-------|---------|
| `DashboardHeader` | Client | `{ displayName, role, orgName?, reviewCount? }` | Sticky header: user info, role badge, action links, sign out. |
| `Sidebar` | Client | `{ pipelineStats, role?, orgName?, pendingRequestCount? }` | Fixed left sidebar: logo, role-based nav groups (admin/partner/neighbor), pipeline stats footer. Active route via `usePathname()`. |

### 4c. `components/maps/` — Leaflet Maps (14 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `HoustonMap` | Client | Base Leaflet container. Centered Houston (29.76, -95.37), OSM/CARTO tiles. |
| `MapMarker` | Client | Custom divIcon marker. 12 types (service, voting, org, etc.) with pathway color override. Popup with contact info. |
| `MapLegend` | Client | Horizontal legend for marker types. |
| `LayerControl` | Client | Floating panel with layer toggles. |
| `MapProvider` | Client | Passthrough wrapper (no API key needed with OSM). |
| `ClusteredMap` | Client | HoustonMap + MarkerClusterGroup. FitBounds, brand-styled clusters. maxClusterRadius=50, unclusters at zoom ≥12. |
| `SingleLocationMap` | Client | Self-contained single marker map. h-[250px], zoom 14. |
| `InteractiveMap` | Client | Full-featured: GeoJSON layers (visible zoom ≥9), clustered markers, layer toggle, GeoInfoPanel, zoom hints. |
| `GeoJsonLayer` | Client | GeoJSON rendering with hover highlight, click handler, module-level cache. |
| `GeoInfoPanel` | Client | Card showing boundary feature details (name, population, income). |
| `MapEntityDrawer` | Client | Bottom slide-up drawer. Entity detail + contact + pathway chips + focus areas. Fetches from `/api/map-markers/detail`. |
| `useMapZoom` | Client hook | Returns current zoom level. |
| `dynamic.ts` | Config | `next/dynamic` wrappers for SSR safety (Leaflet needs `window`). |
| `index.ts` | Barrel | Re-exports all map components. |

### 4d. `components/dashboard/` — Admin (1 file)

| Component | Type | Props | Renders |
|-----------|------|-------|---------|
| `PartnerSubmissionTracker` | Client | `{ orgId }` | Two-tab tracker (guides & events). Queries `guides` and `opportunities` tables. |

### 4e. `components/exchange/` — Public Site (155+ files)

#### Navigation & Layout (10 files)

| Component | Type | Key Features |
|-----------|------|-------------|
| `Header` | Client | Sticky header. Desktop nav (pathways, news, calendar, services, elections, library), search bar, ZIP input, language switcher, auth button. Mobile hamburger. i18n via `useTranslation()`. |
| `Footer` | Server | 7-color pathway spectrum bar. 4-column grid (brand, pathways, navigation, connect). i18n via `getUIStrings()`. |
| `D2Nav` | Client | V2 header: center quick-access, archetype selector, search, progress spiral. |
| `D2Footer` | Client | V2 footer: simplified, tips toggle, good things widget. |
| `HomeTopBar` | Server | Compact top bar with logo + quick links. |
| `LeftNav` | Client | Sidebar navigation with collapsible sections. |
| `WayfinderSidebar` | Client | Sidebar for wayfinder/compass views. |
| `NavigationSidebar` | Client | General-purpose sidebar. |
| `MobileBottomNav` | Client | Bottom tab bar for mobile. |
| `DetailWayfinder` | Server | Pathway explorer with circle graph, center tiers, focus areas. |

#### Hero & Entry Points (6 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `HomepageHero` | Client | Text overlay hero: location, tagline, 3 CTAs. i18n. |
| `HeroBook` | Server | Hero with illustrated book graphic + search. |
| `HeroFOLBackground` | Client | **Animated Flower of Life SVG pattern background.** |
| `HeroZipInput` | Client | ZIP input in hero. |
| `HeroSearchInput` | Client | Search input in hero. |
| `PageHero` | Server | Generic page header: title, subtitle, bgColor, icon. |

#### Flower of Life Components (6 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `FlowerIcons` | Client | Flower of Life SVG icon + ARCHETYPES constant. |
| `FOLElements` | Client | Individual FOL pattern elements. |
| `GradientFOL` | Client | Gradient-variant FOL. |
| `FOLWatermark` | Client | Low-opacity watermark FOL. |
| `FOLLoading` | Client | Animated FOL loading spinner. |
| `HeroFOLBackground` | Client | Full animated FOL background. |

#### Wayfinder & Pathways (12 files)

| Component | Type | Key Features |
|-----------|------|-------------|
| `Wayfinder` | Client | 5-section homepage: hero, stats, 7 pathways grid, persona selector, latest content magazine layout. |
| `WayfinderCircles` | Client | Interactive circle layout for pathway selection. |
| `WayfinderPanel` | Client | Detail panel for selected pathway. |
| `WayfinderNav` | Client | Navigation for wayfinder flows. |
| `WayfinderTooltips` | Client | Contextual tooltips. |
| `WayfinderTracker` | Client | Progress tracker. |
| `PathwayCard` | Client | Clickable card → `/pathways/{slug}`. Color-coded. |
| `PathwayContextBar` | Client | Context bar for current pathway. |
| `PathwayCircle` | Client | Circular pathway selector. |
| `PathwayRibbons` | Client | Ribbon-style pathway indicators. |
| `CompassView` | Client | Hub page: pathways, bridges, content shelves. |
| `CompassEntry` | Client | Entry point with center prompts + adventure links. |

#### Content Cards & Feeds (20+ files)

| Component | Type | Key Features |
|-----------|------|-------------|
| `ContentCard` | Client | Gradient-header card (pathway color). Title, summary, center badge, image, focus area pills. `href` prop for routing. |
| `ContentShelf` | Client | Horizontal scrollable shelf of cards. |
| `FeedCard` | Client | Feed item with grid/list variants. |
| `BraidedFeed` | Client | Feed with center-based filter tabs + layout toggle. |
| `LibraryCard` | Client | Library/knowledge base item card. |
| `LearningPathCard` | Client | Learning path sequence card. |
| `ServiceCard` | Client | Service listing card. |
| `OpportunityCard` | Client | Volunteer/job opportunity card. |
| `PolicyCard` | Client | Policy card with breadcrumbs. |
| `OfficialCard` | Client | Official profile + contact info. |
| `CandidateCard` | Client | Election candidate card. |
| `BadgeCard` | Client | Achievement badge with icon + points. |
| `BallotItemCard` | Client | Expandable ballot measure. |
| `VotingLocationCard` | Client | Voting location with map button. |
| `QuoteCard` | Client | **Testimonial/quote display.** |
| `CommunityImpactCard` | Client | Impact highlight card. |
| `D2Card` | Client | Generic V2 design card. |
| `FeaturedPromo` | Client | **Promotion banner: title, description, CTA, href, bgColor.** |

#### Search & Discovery (8 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `SearchBar` | Client | Icon-left input with onChange. |
| `HeaderSearch` | Client | Header search with autocomplete. |
| `ZipInput` | Client | ZIP code input with lookup. |
| `ZipLookupForm` | Client | Full ZIP form with error handling. |
| `ArchetypeSelector` | Client | 6 archetypes (seeker, learner, builder, watchdog, partner, explorer). Cookie persistence. |
| `PersonaSelector` | Client | Persona/archetype picker. |
| `DetailWayfinder` | Server | Detailed finder experience. |
| `DiscoverSection` | Client | Collapsible sidebar discover links. |

#### Data Visualization (10+ files)

| Component | Type | Purpose |
|-----------|------|---------|
| `CircleKnowledgeGraph` | Client | Interactive orbit diagram. SVG 600x540. Pathways → entities. Click → drawer. |
| `CompactCircleGraph` | Client | Simplified circle viz (no data fetch). |
| `GuideMiniGraph` | Client | Small knowledge graph for guides. |
| `CivicScorecard` | Client | Progress ring + checklist. |
| `SpiralProgress` | Client | Spiral visualization of progress. |
| `SpiralTracker` | Client | Spiral-based metric tracker. |
| `StatsCircle` | Client | Circular stat display. |
| `CivicTimeline` | Client | Timeline of civic events with status indicators. |
| `ModuleProgressTimeline` | Client | Module progress timeline. |
| `ModuleTimeline` | Client | Learning module sequence. |
| `BreakItDown` | Client | AI-generated breakdown (fetches `/api/break-down`). |

#### Elections & Civic (8 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `ElectionBanner` | Client | Hero banner for elections. |
| `ElectionCountdown` | Client | Days-until countdown. |
| `ElectionTimeline` | Client | Election deadline timeline. |
| `ElectionResultsBar` | Client | Results summary. |
| `TurnoutGauge` | Client | Voter turnout visualization. |
| `MyBallot` | Client | Personalized ballot by district. |
| `ElectionReminderSignup` | Client | Email signup form for reminders. |

#### Centers & Community (7 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `CenterCard` | Client | Center card (Learning/Action/Resource/Accountability) with emoji + question. |
| `CenterDoorways` | Client | 4 doorways as entry points. |
| `CentersGrid` | Client | Grid of 4 centers. |
| `NeighborhoodStory` | Client | Neighborhood narrative view. |
| `NeighborhoodBanner` | Client | Hero showing current neighborhood. |
| `LifeSituationCard` | Client | Life situation/persona card. |
| `BridgePills` | Client | Pills linking pathways. |

#### Forms & Input (5 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `DocumentUpload` | Client | File upload to Supabase Storage. |
| `ElectionReminderSignup` | Client | Election reminder email form. |
| `OnboardingFlow` | Client | Multi-step onboarding wizard. |
| `OnboardingLoader` | Client | Loading state during onboarding. |
| `RoleRequestCard` | Client | Role upgrade request form. |

#### Admin & Editorial (6 files)

| Component | Type | Purpose |
|-----------|------|---------|
| `AdminEditPanel` | Client | Inline entity edit panel. Calls `/api/admin/edit-entity`. |
| `EditorialHome` | Server | Editorial dashboard home. |
| `IndexPageHero` | Server | Hero for index pages. |
| `IndexWayfinder` | Server | Wayfinder for index pages. |
| `PageHeader` | Server | Generic page header. |
| `TipsToggle` | Client | Collapsible tips section. |

#### Sidebar (5 files in `exchange/sidebar/`)

| Component | Type | Purpose |
|-----------|------|---------|
| `PathwaysGrid` | Client | Grid of pathway cards in sidebar. |
| `TopicsSection` | Client | Collapsible topic links. |
| `SidebarSearch` | Client | Sidebar search input. |
| `DiscoverSection` | Client | Discover links section. |
| `ZipPersonalization` | Client | ZIP input + neighborhood display in sidebar. |

#### Special / Misc (15+ files)

| Component | Type | Purpose |
|-----------|------|---------|
| `Breadcrumb` | Server | Breadcrumb nav. Reads cookies for i18n. |
| `D2Breadcrumb` | Client | V2 breadcrumb variant. |
| `GuidePage` | Client | Guide detail layout. |
| `GuideNavigation` | Client | Guide sequence navigation. |
| `EntityMesh` | Client | Network/mesh visualization. |
| `ShareButtons` | Client | Social share (Twitter, FB, LinkedIn, copy). |
| `EnvironmentBar` | Client | Dev/staging/prod indicator. |
| `LiveIndicator` | Client | "LIVE" pulse indicator. |
| `TickerTape` | Client | Horizontal scrolling announcements. |
| `ActionBar` | Client | Action buttons (donate, volunteer, call, attend, etc.). |
| `ContentImage` | Client | Image with error fallback. |
| `ChanceChatWidget` | Client | Floating AI chat widget. |
| `LibraryChat` | Client | Chat interface for library questions. |
| `LibraryNugget` | Client | Small knowledge nugget card. |
| `ImageLightbox` | Client | Modal image viewer. |
| `InfoBubble` | Client | Floating info bubble. |
| `GoodThingsWidget` | Client | Community positive stories widget. |
| `ReadingProgressBar` | Client | Reading progress indicator. |
| `TeenHub` | Client | Teen-focused content hub. |

---

## 5. Supabase Connection & Data Layer

### Connection Architecture

```
Browser Components → createClient() [RLS-enforced, cookie auth]
Server Components  → createClient() [RLS-enforced, cookie auth]
API Routes / Crons → createServiceClient() [service role, bypasses RLS]
Edge Functions     → Supabase JS client [service role]
```

**Client factory** (`lib/supabase/client.ts`): `createBrowserClient<Database>(URL, ANON_KEY)`
**Server factory** (`lib/supabase/server.ts`): Cookie-based server client + service role client

### Data Access Layer (`lib/data/`)

30 domain-specific files, all exported via `lib/data/exchange.ts` barrel.

| Module | Key Functions | Tables Queried |
|--------|-------------|----------------|
| `content.ts` | `getLatestContent()`, `getNewsFeed()`, `getResourceFeed()`, `getFeaturedContent()`, `getContentByFocusArea()` | content_published, content_focus_areas |
| `services.ts` | `getServices()`, `getServicesByZip()`, `getServicesWithCoords()` | services_211, organizations |
| `officials.ts` | `getOfficials()`, `getOfficialsByZip()` | elected_officials, official_profiles, zip_codes |
| `organizations.ts` | `getOrganizations()`, `getOrganizationsWithCoords()` | organizations, organization_focus_areas |
| `policies.ts` | `getPolicies()` | policies, policy_geography |
| `elections.ts` | `getNextElection()`, `getElectionDashboard()` | elections, candidates, ballot_items, civic_calendar |
| `events.ts` | `getEventsFeed()`, `getCalendarItems()` | events, content_published, civic_calendar, opportunities |
| `geography.ts` | `getNeighborhoodByZip()`, `getSuperNeighborhoods()`, `getMapMarkers*()`, `getTirzZones()` | neighborhoods, super_neighborhoods, zip_codes, voting_locations, distribution_sites, tirz_zones |
| `homepage.ts` | `getExchangeStats()`, `getCenterCounts()`, `getPathwayCounts()`, `getCompassPreview()`, `getQuotes()` | content_published (counts), quotes |
| `learning.ts` | `getLearningPaths()`, `getGuides()`, `getGuideBySlug()` | learning_paths, guides |
| `foundations.ts` | `getFoundationsIndex()`, `getFoundationPathways()` | foundations, foundation_pathways, foundation_focus_areas |
| `taxonomy.ts` | Full taxonomy queries | themes, focus_areas, sdgs, sdoh_domains, service_categories, airs_codes |
| `dashboard.ts` | `getPipelineStats()`, `getReviewQueue()`, `getPublishedContent()`, `getIngestionLog()`, `getFidelityOverview()`, `getGraphExplorerData()` | content_inbox, content_review_queue, content_published, translations, ingestion_log, entity_completeness, all junction tables |
| `search.ts` | `searchAll(query)` | Full-text across content_published, services_211, elected_officials, organizations, policies, life_situations, resources, learning_paths |
| `shared.ts` | `getLangId()`, `fetchTranslationsForTable()` | languages, translations |
| `edge-functions.ts` | `translateAll()`, `scoreAllEntities()`, `updateEntityField()`, `enrichEntities()` | Various via service role |
| `enrich-entities.ts` | `enrichEntityDirect()`, `enrichContentDirect()` | All entity tables + all junction tables |
| `score-entities.ts` | Entity scoring/ranking | entity_completeness |
| `civic-dashboard.ts` | `getCivicHubData()` | elected_officials, policies, elections, official_profiles |
| `civic.ts` | `getHoustonWeather()`, `getHoustonAirQuality()` | External APIs (NWS, AQICN, USGS) — no Supabase |
| `adventures.ts` | Static adventure data | None |

### Key Tables (200+ total)

**Core Entities**: content_published, content_inbox, services_211, elected_officials, organizations, opportunities, events, policies, foundations, candidates, agencies, benefit_programs, municipal_services, guides, learning_paths, kb_documents

**Geographic**: neighborhoods, super_neighborhoods, zip_codes, districts, precincts, voting_locations, distribution_sites, tirz_zones

**Taxonomy (16 dimensions)**: themes, focus_areas, sdgs, sdoh_domains, service_categories, airs_codes, audience_segments, life_situations, action_types, skills, time_commitments, government_levels

**Junction Tables (50+)**: `{entity}_{taxonomy}` pattern — e.g., content_focus_areas, content_pathways, content_sdgs, policy_focus_areas, service_life_situations, official_focus_areas, foundation_pathways, etc.

**Pipeline**: content_review_queue, ingestion_log, source_trust, rss_feeds, translations

**Auth/Users**: user_profiles, user_actions, api_keys, community_edits

**Graph**: entity_completeness, kb_chunks (vector search)

---

## 6. Data Shapes by Page

### Homepage (`/(exchange)/page.tsx`)

```typescript
{
  stats: ExchangeStats           // { resources, services, officials, learningPaths, organizations, policies, opportunities, elections }
  pathwayCounts: Record<string, number>   // { THEME_01: 42, THEME_02: 31, ... }
  newThisWeek: number
  latestContent: ContentPublished[]       // { id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url, source_domain, published_at, content_type }
  centerCounts: Record<string, number>    // { Learning: 50, Action: 30, Resource: 45, Accountability: 20 }
  organizations: Organization[]           // Top orgs for display
}
```

### Service Detail (`/services/[id]`)

```typescript
{
  service: Service211 & { org_name, latitude, longitude }
  organization: Organization | null
  relatedServices: ServiceWithOrg[]
  libraryNuggets: KbDocument[]
  quote: Quote | null
  translations: TranslationMap    // { [inbox_id]: { title?, summary? } }
}
```

### Official Detail (`/officials/[id]`)

```typescript
{
  official: ElectedOfficial
  profile: OfficialProfile | null        // LinkedIn, extended bio
  focusAreas: FocusArea[]
  policies: Policy[]
  committees: string[]
  voteRecords: any[]                     // as any — type gap
  translations: TranslationMap
}
```

### Search Results (`/search`)

```typescript
SearchResults = {
  content: SearchResultContent[]         // id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at
  officials: SearchResultOfficial[]      // official_id, official_name, title, level, party, jurisdiction
  services: SearchResultService[]        // service_id, service_name, description_5th_grade, org_name, phone, address
  organizations: SearchResultOrganization[]  // org_id, org_name, description_5th_grade, org_type
  policies: SearchResultPolicy[]         // policy_id, policy_name, title_6th_grade, policy_type, level, status
  situations: SearchResultSituation[]    // situation_id, situation_name, description_5th_grade, urgency_level
  resources: SearchResultResource[]      // resource_id, resource_name, description_5th_grade
  paths: SearchResultPath[]              // path_id, path_name, description_5th_grade, theme_id
}
```

### Pathway Hub (`/pathways/[slug]`)

```typescript
PathwayHubItem = {
  themeId: string
  heroContent: ContentPreview[]          // { id, title, summary, pathway, center, image_url, source_url }
  contentCounts: Record<string, number>  // By center
  totalContent: number
  entityCounts: { services, officials, organizations, policies, opportunities }
  focusAreas: FocusArea[]
  learningPaths: LearningPath[]
  guides: Guide[]
  bridges: { themeId, name, color }[]    // Related pathways
}
```

### Dashboard Home (`/dashboard`)

```typescript
{
  pipeline: PipelineStats               // { totalIngested, needsReview, published, translated }
  breakdown: ReviewStatusBreakdown      // { auto_approved, pending, flagged, rejected, total }
  byPathway: Record<string, number>
  byCenter: Record<string, number>
  activityLog: IngestionLog[]           // { id, action, entity_type, entity_id, details, created_at }
}
```

### Geography / Map (`/geography`)

```typescript
GeographyData = {
  superNeighborhoods: SuperNeighborhood[]
  neighborhoods: Neighborhood[]
  serviceMarkers: MapMarkerData[]       // { id, lat, lng, title, type, address, phone, link }
  organizationMarkers: MapMarkerData[]
  officials: ElectedOfficial[]
  policies: Policy[]
}
// Plus GeoJSON files loaded from /public/geo/*.geojson
```

### Calendar (`/calendar`)

```typescript
CalendarItem = {
  id: string
  title: string
  description: string
  category: 'event' | 'civic' | 'opportunity' | 'content'
  date: string
  endDate?: string
  location?: string
  isVirtual: boolean
  registrationUrl?: string
  sourceUrl?: string
  imageUrl?: string
  pathway?: string
  eventType?: string
  orgName?: string
  orgId?: string
  detailHref: string
  isFree?: boolean
  isRecurring?: boolean
  recurrencePattern?: string
}
```

---

## 7. Styling & Design System

### Brand Colors (Tailwind `colors.brand.*`)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | #FAF8F5 | Page background (warm cream) |
| `bg-alt` | #EDE8E0 | Alternate background |
| `cream` | #FBF9F6 | Card backgrounds |
| `text` | #1A1A1A | Body text |
| `accent` | #C75B2A | Primary accent (warm orange) |
| `accent-hover` | #B5481A | Accent hover |
| `muted` | #6B6560 | Secondary text |
| `muted-light` | #9B9590 | Tertiary text |
| `border` | #E2DDD5 | Borders (light tan) |
| `card` | #FFFFFF | Card surfaces |
| `success` | #2D8659 | Success states |
| `warning` | #C47D1A | Warning states |
| `danger` | #c43c4c | Error states |
| `dark` | #3A3A3A | Dark surfaces (sidebar) |
| `sand` | #D5D0C8 | Offset shadow color |
| `warm` | #B5AFA8 | Warm muted |

### Pathway Colors (`colors.theme.*`)

| Pathway | Color | Hex |
|---------|-------|-----|
| Health | Red | #e53e3e |
| Families | Orange | #dd6b20 |
| Neighborhood | Gold | #d69e2e |
| Voice | Green | #38a169 |
| Money | Blue | #3182ce |
| Planet | Teal | #319795 |
| The Bigger We | Purple | #805ad5 |

### Center Colors (`colors.center.*`)

| Center | Color | Hex |
|--------|-------|-----|
| Learning | Blue | #3182ce |
| Action | Green | #38a169 |
| Resource | Orange | #C75B2A |
| Accountability | Purple | #805ad5 |

### Typography

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | DM Sans | Body text, UI |
| `font-serif` | DM Serif Display | All headings |
| `font-hand` | Caveat | Handwritten accent text |
| `font-mono` | Space Mono | Labels, meta, code |

| Size Token | Value | Line Height |
|-----------|-------|-------------|
| `display` | 3.5rem | 1.1 |
| `headline` | 2.25rem | 1.15 |
| `title` | 1.5rem | 1.25 |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `card` | 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04) | Default card |
| `card-hover` | 0 8px 28px rgba(0,0,0,0.12) | Hovered card |
| `offset` | 3px 3px 0 #D5D0C8 | Chunky editorial style |
| `offset-lg` | 4px 4px 0 #D5D0C8 | Large chunky style |
| `header` | 0 1px 0 rgba(0,0,0,0.05) | Sticky header |
| `drop` | 0 8px 24px rgba(0,0,0,0.1) | Floating elements |

### Border Radius

| Token | Value |
|-------|-------|
| `card` | 0.75rem |

### CSS Utility Classes (globals.css)

| Class | Effect |
|-------|--------|
| `.card-lift` | Hover: translateY(-3px) + offset shadow |
| `.card-chunky` | 2px border, chunky mockup style |
| `.card-stat` | Permanent offset shadow |
| `.color-bar-left::before` | Left accent bar (expands on hover) |
| `.meta-label` | Space Mono, 10px, uppercase, widest tracking |
| `.meta-source` | Space Mono, 9px, uppercase |
| `.effort-tag` | Inline square badge |
| `.section-rule` | Gradient divider line |
| `.spectrum-bar` | 7-color pathway indicator strip |
| `.scrollbar-hide` | Cross-browser scrollbar hide |
| `.texture::after` | Subtle noise overlay |

### Animations

| Name | Duration | Effect |
|------|----------|--------|
| `fol-spin` | 60s | 360° rotation (Flower of Life) |
| `fol-pulse` | 10s | Subtle scale pulse |
| `fol-pulse-cta` | 8s | Scale + rotate pulse |
| `fol-color-cycle` | 20s | 360° hue rotation (rainbow) |
| `zip-glow` | 2s | Border glow cycle |
| `lens-drift` | 12s | Drift effect |
| `fade-up` | 0.4s | Fade in + translate up |
| `bounce-slow` | 2s | Vertical bounce |
| `ticker-scroll` | 60s | Horizontal ticker (pauses on hover) |
| `announcement-scroll` | 20s + 3s | Horizontal scroll + opacity pulse |

### Design Patterns

- **Cards**: Warm cream backgrounds, chunky offset shadows, left color bar accent
- **Pathway color coding**: Every entity gets its primary pathway's color for visual grouping
- **Center badges**: Blue/Green/Orange/Purple dots next to center name
- **Editorial feel**: Serif headings, mono meta labels, handwritten accents
- **Accessibility**: 2px solid orange focus indicators with 2px offset on all focusable elements

---

## 8. Unusual, Broken, or Incomplete

### CRITICAL: Built Infrastructure Never Rendered Publicly

#### Promotions — Admin CRUD Exists, Zero Public Rendering

The `promotions` table is fully populated with fields: `promo_id`, `title`, `subtitle`, `description`, `promo_type` (Partner Spotlight, Event, Resource, Campaign, Announcement), `org_id`, `content_id`, `image_url`, `cta_text`, `cta_href`, `color`, `start_date`, `end_date`, `is_active`, `display_order`.

- `/dashboard/promotions` has a complete admin panel (add/edit form, calendar view, list view, active toggle)
- The `FeaturedPromo` component exists and accepts `{ title, description, cta, href, bgColor }`
- **BUT: No public page ever queries the `promotions` table or renders `FeaturedPromo`.**
- Admins can create promotions that nobody ever sees.

**The reskin MUST wire promotions into public pages.** Suggested placements:
- Homepage hero / above-the-fold banner
- Pathway page featured spots
- Sidebar promotion slots on browse pages
- Detail page contextual promos (matching pathway)

Data functions to use: `getFeaturedContent()` from `lib/data/homepage.ts`, or create a new `getActivePromotions()` function.

Promotion data shape:
```typescript
{
  promo_id: string
  title: string
  subtitle: string | null
  description: string | null
  promo_type: 'partner_spotlight' | 'event' | 'resource' | 'campaign' | 'announcement'
  org_id: string | null
  content_id: string | null
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

#### Quotes — Admin CRUD Exists, Zero Public Rendering

The `quotes` table has fields: `quote_id`, `quote_text`, `attribution`, `source_url`, `pathway_id`, `focus_area_id`, `is_active`, `display_order`.

- `/dashboard/quotes` has a complete admin panel (add/edit, list, active toggle, pathway filtering)
- `QuoteCard` component exists
- `getQuotes(pathwayId?, limit?)` and `getRandomQuote(pathwayId?)` data functions exist in `lib/data/homepage.ts`
- **BUT: No public page ever calls `getQuotes()` or renders `QuoteCard`.**

**The reskin MUST wire quotes into public pages.** Suggested placements:
- Detail pages (service, official, policy) — contextual quote matching the entity's pathway
- Pathway pages — pathway-specific quotes
- Homepage — rotating featured quote
- Between content sections as visual breaks / breathing room

Quote data shape:
```typescript
{
  quote_id: string
  quote_text: string
  attribution: string
  source_url: string | null
  pathway_id: string | null       // null = general, otherwise pathway-specific
  focus_area_id: string | null
  is_active: boolean
  display_order: number
}
```

### CRITICAL: ~100 Data Functions Never Called by Any Page

The data layer (`lib/data/`) exports ~140 functions but pages only use ~40. These unused functions represent **built backend infrastructure with no frontend**:

#### Neighborhood Personalization (12+ functions — never called)
These were designed for ZIP-based content filtering that was never implemented in the UI:
- `getContentForNeighborhood(neighborhoodId)` — content relevant to a specific neighborhood
- `getServicesByZip(zip)` — services near a ZIP code
- `getServicesByNeighborhood(neighborhoodId)` — services in a neighborhood
- `getPoliciesForNeighborhood(neighborhoodId)` — policies affecting a neighborhood
- `getOrganizationsByNeighborhood(neighborhoodId)` — orgs operating in a neighborhood
- `getOfficialsByZip(zip)` — officials representing a ZIP (partially used by `/officials/lookup`)
- `getMapMarkersForNeighborhood(neighborhoodId)` — map markers for a hood
- `getMapMarkersForSuperNeighborhood(snId)` — map markers for a super neighborhood
- `getMunicipalServiceMarkers()` — emergency, police, fire, parks, library markers
- `getCivicProfileByZip(zip)` — full civic profile for a ZIP
- `getOrganizationsBySdoh(sdohCode)` — orgs by social determinant of health

**Impact on reskin:** If the new design includes a "your neighborhood" or "near you" experience, all the backend is ready. The NeighborhoodContext already stores the user's ZIP.

#### Pathway Drill-Down (12+ functions — never called)
Rich pathway exploration that's available but not surfaced:
- `getPathwayBraidedFeed(themeId)` — braided content feed for a pathway
- `getCenterContentForPathway(themeId)` — content by center within a pathway
- ~~`getThemeDrillDown(themeId)`~~ — removed (superseded by composable `getPathwayContent` + `getRelated*`)
- `getFocusAreaDrillDown(focusAreaId)` — focus area deep dive
- `getPathwayTopics(themeId)` — topics within a pathway
- `getPathwayNewsCount(themeId)` — news count for a pathway
- `getContentByCenter(center)` — all content for a center
- `getContentByFocusArea(focusId)` — content by focus area

**Impact on reskin:** Pathway pages (`/pathways/[slug]`) could be much richer with braided feeds, center breakdowns, and topic navigation.

#### Related Entity Functions (8+ functions — never called)
Detail pages could show "Related items" but don't call these:
- `getRelatedOfficials(focusAreaIds)` — officials sharing focus areas
- `getRelatedServices(focusAreaIds)` — services sharing focus areas
- `getRelatedPolicies(focusAreaIds)` — policies sharing focus areas
- `getRelatedOpportunities(focusAreaIds)` — opportunities sharing focus areas
- `getRelatedContentForGuide(focusAreaIds)` — content related to a guide
- `getRelatedOrgsForGuide(focusAreaIds)` — orgs related to a guide
- `getSiblingDocuments(docId)` — related library documents

**Impact on reskin:** Every detail page should have a "Related" section. The backend is ready — just call these functions and render the results.

#### Knowledge Graph (6+ functions — largely unused)
- `getCircleGraphData()` — data for orbit diagram
- ~~`getKnowledgeGraphData()`~~ — removed (superseded by `getCircleGraphData`)
- `getEntityMeshProfile(entityId)` — entity relationship mesh
- `getMeshPath(fromId, toId)` — path between entities in the graph

### Detail Pages Missing Error Boundaries

8 detail pages lack `error.tsx` (will show raw errors to users):
- `/adventures/[slug]`
- `/benefits/[id]`
- `/campaigns/[id]`
- `/learning-paths/[id]`
- `/collections/[id]`
- `/agencies/[id]`
- `/help/[slug]`
- `/elections/[id]`

### Stub / Placeholder Pages

| Route | Issue |
|-------|-------|
| `/campaigns/[id]` | Only 87 lines. Minimal: progress bar + goal. No timeline, updates, or related content. |
| `/learning-paths/[id]` | Fetches `module_count` but never fetches or renders actual modules. |
| `/collections/[id]` | Fallback logic suggests collection item membership isn't persisted correctly. |
| `/quizzes` | Just redirects to `/adventures`. |
| `/donate` | Has placeholder PayPal button ID. |
| `/coming-soon` | Generic template, no real content. |

### No Admin CRUD for 6 Major Entity Types

Admins can only manage content through the review/classify pipeline. There is **no edit/manage UI** for:

| Entity | Table | Can Ingest | Can Edit in Admin | Can Browse Publicly |
|--------|-------|-----------|-------------------|-------------------|
| Services | services_211 | Yes | No | Yes |
| Organizations | organizations | Yes | No | Yes |
| Elected Officials | elected_officials | Yes | No | Yes |
| Policies | policies | Yes | No | Yes |
| Candidates | candidates | Yes | No | Yes |
| Ballot Items | ballot_items | Yes | No | Yes |

The only editing available is the generic inline `AdminEditPanel` on detail pages (limited field editing).

### User Settings Incomplete

`/me/settings` is missing:
- Email change (mentioned in UI copy "Update your email or password" but only password form exists)
- Notification preferences (referenced but no UI)
- Account deletion / data export

### Type Safety Gaps
- `as any` casts in `/officials/[id]/page.tsx` (line ~70) and similar detail pages for DB query results that don't match generated types exactly
- `official_profiles` type may not exist in database.types.ts (referenced with `as any`)

### Incomplete Features
- **CAPTCHA**: `@marsidev/react-turnstile` installed but NOT wired up. Needs Cloudflare domain config.
- **San Francisco data**: `SF_GEO_LAYERS` constant exists + `/api/cron/sync-city-sf` endpoint, but SF is not an active deployment.
- **design1/ and design2/**: Legacy prototype routes still exist as files but the v1/v2 layout toggle has been removed. These routes are orphaned and can be deleted during reskin.
- **KnowledgeGraphClient.tsx**: Referenced but file not found during component audit.

### Duplicate / Legacy Patterns
- **V1/V2 toggle removed** — `(exchange)/layout.tsx` now renders only the D2 layout (D2Nav, D2Footer, TranslateBar, TickerTape). The `design` cookie, `LeftNav`, `Footer` (v1), `MobileBottomNav`, `TranslateWidget`, and `ElectionBanner` imports were removed.
- Legacy v1 components (`Header.tsx`, `Footer.tsx`, `LeftNav.tsx`, `MobileBottomNav.tsx`) still exist as files but are no longer imported by the layout. Safe to delete during reskin.
- `/api/intake` and `/api/ingest` are duplicate endpoints for the same pipeline.

### Translation Edge Cases
- Translation ID generation in `/api/translate` uses substring hash (first 8 chars of content_id) — theoretically could collide.
- Translation lookup depends on `inbox_id` foreign key, but routing uses `content_published.id` — the join between them is critical.
- Admin translation UI (`/dashboard/translations`) — unclear if admins can manually edit incorrect auto-translations.

### Data Quality
- `entity_completeness` table tracks data quality per entity. Dashboard shows many entities with low completeness scores.
- Some junction tables may have stale references if entities are deleted without cascade.

### Performance Notes
- `database.types.ts` is 8,276 lines — auto-generated, but adds to bundle if imported incorrectly (should be type-only imports).
- 50+ loading.tsx skeletons across detail routes — consistent pattern but could be consolidated with a shared skeleton component.
- No Redis or external cache — relies entirely on Next.js ISR + React `cache()`.

### Routing Rules (from CLAUDE.md)
1. Every `href` must point to an existing `page.tsx`
2. Use `content_published.id` (UUID) as routing key — never `inbox_id`
3. `inbox_id` is only for translation lookup + pipeline joins
4. ContentCard accepts `href` prop for routing override

---

## Appendix: Constants Reference

### 7 Pathways (THEMES)

| ID | Name | Slug | Color | Question |
|----|------|------|-------|----------|
| THEME_01 | Health | health | #e53e3e | How can I be well? |
| THEME_02 | Families | families | #dd6b20 | How can my family thrive? |
| THEME_03 | Neighborhood | neighborhood | #d69e2e | How can my neighborhood grow? |
| THEME_04 | Voice | voice | #38a169 | How can I be heard? |
| THEME_05 | Money | money | #3182ce | How can I build wealth? |
| THEME_06 | Planet | planet | #319795 | How can I protect our planet? |
| THEME_07 | The Bigger We | the-bigger-we | #805ad5 | How can we come together? |

### 4 Centers

| Name | Question | Color |
|------|----------|-------|
| Learning | How can I understand? | #3182ce |
| Action | How can I help? | #38a169 |
| Resource | What's available to me? | #C75B2A |
| Accountability | Who makes decisions? | #805ad5 |

### 6 Archetypes

Seeker, Learner, Builder, Watchdog, Partner, Explorer

### 3 Languages

EN (English), ES (Spanish, LANG-ES), VI (Vietnamese, LANG-VI)

### GeoJSON Layers (public/geo/)

super-neighborhoods, council-districts, congressional-districts, state-senate-districts, state-house-districts, school-districts, zip-codes, census-tracts, tirz-zones
