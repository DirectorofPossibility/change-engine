# The Change Engine — Sprint Tracker

## Sprint 0: Foundation (COMPLETE)
- [x] 0.1 Repo organized for MVP build
- [x] 0.2 All 17 Edge Functions exported to repo
- [x] 0.3 Publish pipeline FIXED (65 items published)
- [x] 0.4 Anthropic API key verified (classify-content-v2 returns 0.95 confidence)
- [x] 0.5 TypeScript types generated (67 tables, 3648 lines)
- [x] 0.6 Vercel deploy verified (https://change-lab-api.vercel.app)

## Sprint 1: Engine Hardening (COMPLETE)
- [x] 1.1 classify-content-v2 fills ALL 15 dimensions (verified 15/15)
- [x] 1.2 CSV upload endpoint (csv-upload deployed, 5/5 test passed)
- [x] 1.3 10 RSS feeds connected (rss_feeds table + poll_all mode)
- [x] 1.4 Confidence-based auto-routing (3-tier: >=0.8/>=0.5/<0.5)
- [x] 1.5 Translation pipeline UPSERT fix (EN→ES/VI verified)
- [x] 1.6 Cron jobs configured (8 total: 5 backfill + rss-poll + auto-publish + batch-translate)
- [x] 1.7 102 items published (115 inbox, 102 published)
- [x] 1.8 Quality spot-check (20/20 pass)

## Sprint 2: Change Lab Dashboard (COMPLETE)
- [x] 2.1 Tailwind CSS v3 installed and configured (brand colors, theme colors, sidebar colors)
- [x] 2.2 Types & data layer (dashboard.ts types, data fetchers, edge-function callers)
- [x] 2.3 8 reusable UI components (StatsCard, ThemePill, CenterBadge, ConfidenceBadge, PipelineFlow, SlidePanel, Modal, StatusBadge)
- [x] 2.4 Dashboard layout + sidebar (Sidebar with nav + pipeline status, dashboard layout)
- [x] 2.5 Overview page (stats cards, pipeline flow, pathway/center breakdowns, activity log, cron status)
- [x] 2.6 Review Queue (filter tabs, 15-dimension detail panel, approve/reject server actions)
- [x] 2.7 Published Content (search, pathway/center filters, featured/active toggles, edit modal)
- [x] 2.8 Ingestion Monitor (3 tabs: pipeline logs, RSS feeds CRUD, source trust CRUD)
- [x] 2.9 Submit URL (single URL classify + CSV batch upload)
- [x] 2.10 Translations (ES/VI coverage meters, translation table, translate-all button)
- [x] 2.11 Taxonomy Browser (7 theme cards, focus areas with SDG/SDOH/NTEE/AIRS crosswalks)
- [x] 2.12 Build verified (all 11 routes compile, 7 dashboard pages functional)
## Sprint 3: Exchange Core (COMPLETE)
- [x] 3.1 Exchange layout + Header + Footer (sticky nav, mobile hamburger, brand styling)
- [x] 3.2 11 exchange components (ContentCard, PathwayCard, CenterCard, LifeSituationCard, ServiceCard, LearningPathCard, OfficialCard, SearchBar, LanguageSwitcher, ThemePill, CenterBadge)
- [x] 3.3 Exchange data layer (12 fetchers: stats, centers, content, situations, officials, services, learning paths, pathways)
- [x] 3.4 Homepage (hero, 4 centers, 7 pathways, featured help, latest resources, stats bar)
- [x] 3.5 Pathways list + detail pages (slug routing, center filter tabs, sidebar with situations + learning paths)
- [x] 3.6 I Need Help list + detail pages (urgency grouping, crisis banner, matched content + services + learning path)
- [x] 3.7 Officials page (grid with level badges, email/phone/website links)
- [x] 3.8 Services page (org names joined, phone/address/website)
- [x] 3.9 Learn page (learning paths with difficulty, modules, time estimates)
- [x] 3.10 Build verified (17 routes compile, 9 public exchange pages + 7 dashboard pages)

## Sprint 4: Enrichment & Personalization (COMPLETE)
- [x] 4.1 Types + constants (Translation, Neighborhood, Opportunity, Policy, FocusArea types; LANGUAGES constant with EN/ES/VI + language IDs)
- [x] 4.2 11 new data fetchers (getFocusAreas, getFocusAreaMap, getRelatedOpportunities, getRelatedPolicies, getTranslations, getTranslationAvailability, getNeighborhoodByZip, getOfficialsForDistrict, getServicesByZip)
- [x] 4.3 Global search (searchAll across content/officials/services with ilike; /search?q= page with grouped results)
- [x] 4.4 Language context (LanguageProvider + useLanguage hook, cookie persistence, Supabase translation loading, cache in state)
- [x] 4.5 Neighborhood context (NeighborhoodProvider + useNeighborhood hook, ZIP lookup, council district + officials resolution)
- [x] 4.6 Layout updated (reads lang/zip cookies, wraps children with LanguageProvider + NeighborhoodProvider)
- [x] 4.7 Header updated (search form, ZipInput, LanguageSwitcher in desktop + mobile nav)
- [x] 4.8 LanguageSwitcher rewired to useLanguage() context
- [x] 4.9 5 new components (OpportunityCard, PolicyCard, FocusAreaPills, TranslatedContentGrid, NeighborhoodBanner)
- [x] 4.10 ContentCard updated (optional focusAreaNames prop with FocusAreaPills)
- [x] 4.11 Homepage enriched (NeighborhoodBanner after hero, TranslatedContentGrid for latest resources)
- [x] 4.12 Pathway detail enriched (opportunities + policies in sidebar via focus area matching)
- [x] 4.13 Help detail enriched (opportunities + policies sections below existing content/services)
- [x] 4.14 Build verified (17 routes compile, 0 TypeScript errors, 20 files changed, 1159 additions)

## Sprint 4b: Exchange Detail Pages (COMPLETE)
- [x] 4b.1 9 new components (ActionBar, CandidateCard, BallotItemCard, VotingLocationCard, ModuleTimeline, BadgeCard, ZipLookupForm, ElectionCountdown, RelatedContent)
- [x] 4b.2 Content detail page (/content/[id]) — full 15-dimension display, action bar, translations, sidebar metadata (pathway, focus areas, SDGs, SDOH, audience, life situations), classification reasoning, related content
- [x] 4b.3 Official detail page (/officials/[id]) — level badge, contact card, about, district info, connected policies, related content
- [x] 4b.4 ZIP lookup page (/officials/lookup) — full ZipLookupForm with officials grouped by level, neighborhood info, voting locations
- [x] 4b.5 Elections list page (/elections) — upcoming countdown banner, future/past grouping
- [x] 4b.6 Election detail page (/elections/[id]) — countdown, register CTA, candidates by office, ballot items, voting locations
- [x] 4b.7 Service detail page (/services/[id]) — contact/access card, eligibility/fees/languages, parent org link, related services
- [x] 4b.8 Organization detail page (/organizations/[id]) — logo, contact, JSONB hours + social media, stats, tags, services list
- [x] 4b.9 Learning path detail page (/learn/[id]) — module timeline, quizzes, badge earned, prerequisite path
- [x] 4b.10 Policies list + detail pages (/policies, /policies/[id]) — status badges, timeline, summary, connected officials, related policies
- [x] 4b.11 Neighborhood detail page (/neighborhoods/[id]) — demographics, description, local services, ZIP lookup link
- [x] 4b.12 ContentCard updated (links internally to /content/[id] instead of external source)
- [x] 4b.13 Header updated (added Elections + Find Your Reps nav links)
- [x] 4b.14 Footer updated (added Elections, Policies, Find Your Reps links)
- [x] 4b.15 Build verified (29 routes compile, 0 TypeScript errors, 23 files changed, 2141 additions)

## Sprint 5: Polish & Launch (Week 5-6)
