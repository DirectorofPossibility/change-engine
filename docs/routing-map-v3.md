# Field Guide Redesign — Complete Routing Map

Every current route mapped to its new location. Nothing left behind.

---

## NEW ROUTE STRUCTURE

```
/                               Homepage — guide cover
/start                          Resource finder wizard (3-step onramp)

/health                         Pathway chapter 1
/families                       Pathway chapter 2
/neighborhood                   Pathway chapter 3
/voice                          Pathway chapter 4
/money                          Pathway chapter 5
/planet                         Pathway chapter 6
/the-bigger-we                  Pathway chapter 7

/orgs                           Organization directory (the spine)
/orgs/[slug]                    Organization profile (the listing)

/services                       Service directory
/services/[id]                  Service detail

/officials                      Officials directory
/officials/[id]                 Official profile
/officials/lookup               ZIP → officials lookup

/policies                       Policy tracker
/policies/[id]                  Policy detail

/opportunities                  Opportunities board
/opportunities/[id]             Opportunity detail

/elections                      Elections dashboard
/elections/[id]                 Election detail

/content/[id]                   Article / report / video detail

/map                            Full map view (all entity types)
/neighborhoods                  Neighborhood directory
/neighborhoods/[id]             Neighborhood guide
/calendar                       Civic calendar (seasonal + deadlines)
/news                           What's new feed
/search                         Search
/my-plan                        Saved resources + notes + reps

/help                           Life situations index
/help/[slug]                    Life situation detail (crisis, job loss, etc.)

/chat                           Chance AI assistant

/about                          About
/contact                        Contact
/privacy                        Privacy policy
/terms                          Terms of use
/accessibility                  Accessibility
```

---

## COMPLETE MIGRATION MAP — All 103 Routes

### KEEP AS-IS (route stays, page gets redesigned)

| Current Route | New Route | Notes |
|---|---|---|
| `/` | `/` | Full redesign — guide cover |
| `/services` | `/services` | Redesign as filterable directory |
| `/services/[id]` | `/services/[id]` | Redesign with standardized card layout |
| `/officials` | `/officials` | Redesign with geo filtering |
| `/officials/[id]` | `/officials/[id]` | Keep, redesign styling |
| `/officials/lookup` | `/officials/lookup` | Keep — core tool |
| `/policies` | `/policies` | Redesign as policy tracker |
| `/policies/[id]` | `/policies/[id]` | Keep, redesign styling |
| `/opportunities` | `/opportunities` | Redesign with trail level + time filters |
| `/opportunities/[id]` | `/opportunities/[id]` | Keep, redesign styling |
| `/elections` | `/elections` | Keep as elections dashboard |
| `/elections/[id]` | `/elections/[id]` | Keep |
| `/content/[id]` | `/content/[id]` | Keep — content detail |
| `/news` | `/news` | Redesign as "What's new" with content type badges |
| `/neighborhoods` | `/neighborhoods` | Keep as neighborhood directory |
| `/neighborhoods/[id]` | `/neighborhoods/[id]` | Keep as neighborhood guide |
| `/calendar` | `/calendar` | Redesign as civic calendar with seasonal awareness |
| `/search` | `/search` | Keep, add entity type tabs |
| `/help` | `/help` | Keep — life situations hub |
| `/help/[slug]` | `/help/[slug]` | Keep — situation-specific resources |
| `/chat` | `/chat` | Keep — Chance AI |
| `/about` | `/about` | Keep |
| `/contact` | `/contact` | Keep |
| `/privacy` | `/privacy` | Keep |
| `/terms` | `/terms` | Keep |
| `/accessibility` | `/accessibility` | Keep |

### MOVE / RENAME (page lives on, route changes)

| Current Route | New Route | What happens |
|---|---|---|
| `/organizations` | `/orgs` | Rename. Shorter, guide-style. Old route → redirect. |
| `/organizations/[id]` | `/orgs/[slug]` | Rename + switch from UUID to slug. Old route → redirect. |
| `/pathways/[slug]` | `/[slug]` (top-level) | Pathways promoted to chapters. `/pathways/health` → `/health`. |
| `/me` | `/my-plan` | Reframed as civic plan, not account page. Old → redirect. |
| `/me/settings` | `/my-plan/settings` | Nested under my-plan. |
| `/me/submit` | `/my-plan/submit` | Nested under my-plan. |
| `/foundations/[id]` | `/orgs/[slug]` | Foundations are orgs. Same page, org_type filter. |
| `/candidates` | `/elections/candidates` | Nest under elections. |
| `/candidates/[id]` | `/elections/candidates/[id]` | Nest under elections. |
| `/ballot` | `/elections/ballot` | Nest under elections. |
| `/polling-places` | `/elections/polling-places` | Nest under elections. |
| `/agencies` | `/orgs?type=agency` | Agencies are orgs. Filter, not separate page. |
| `/agencies/[id]` | `/orgs/[slug]` | Agency detail → org profile. |
| `/benefits` | `/services?type=benefit` | Benefits are services. Filter, not separate page. |
| `/benefits/[id]` | `/services/[id]` | Benefit detail → service detail. |
| `/municipal-services` | `/services?type=municipal` | Municipal services are services. Filter. |
| `/municipal-services/[id]` | `/services/[id]` | Detail → service detail. |
| `/events` | `/calendar` | Events absorbed into calendar. |
| `/events/[id]` | `/calendar/[id]` | Event detail under calendar. |
| `/super-neighborhoods` | `/neighborhoods?view=super` | Tab or filter on neighborhoods page. |
| `/super-neighborhoods/[id]` | `/neighborhoods/[id]` | Same detail page, super-neighborhood variant. |
| `/campaigns` | `/opportunities?type=campaign` | Campaigns are opportunities. Filter. |
| `/campaigns/[id]` | `/opportunities/[id]` | Campaign detail → opportunity detail. |
| `/districts` | `/voice#districts` | Section within Voice pathway chapter. |
| `/tirz` | `/neighborhood#tirz` | Section within Neighborhood pathway chapter. |
| `/tirz/[id]` | `/neighborhoods/[id]` | TIRZ detail absorbed into neighborhood detail. |
| `/teens` | `/for/teens` | Audience page stays but moves under /for/. |
| `/bookshelf` | `/my-plan#saved` | Saved items → My Plan. |

### NEW PAGES TO CREATE

| New Route | What it is |
|---|---|
| `/start` | Resource finder wizard — 3-step onramp (Merlin pattern) |
| `/health` | Health pathway chapter (full entity guide) |
| `/families` | Families pathway chapter |
| `/neighborhood` | Neighborhood pathway chapter |
| `/voice` | Voice pathway chapter |
| `/money` | Money pathway chapter |
| `/planet` | Planet pathway chapter |
| `/the-bigger-we` | Bigger We pathway chapter |
| `/orgs` | Organization directory (redesigned from /organizations) |
| `/orgs/[slug]` | Organization profile with Newsletter/Volunteer/Donate |
| `/map` | Full map view — all entity types, dual browse |
| `/my-plan` | Civic plan — saved resources, notes, reps, calendar |

### ABSORB INTO PATHWAY CHAPTERS (content lives in pathway pages, route redirects)

These pages become **sections within pathway chapter pages** rather than standalone pages. The route redirects to the relevant pathway.

| Current Route | Absorbed Into | As Section |
|---|---|---|
| `/pathways` | `/` (homepage) | The 7 pathway cards on homepage ARE the pathways index |
| `/centers` | Retired | Centers are a classification axis, not a nav layer |
| `/centers/[slug]` | Pathway chapters | Each center's content appears in relevant pathways |
| `/learning` | `/health`, `/families`, etc. | "From the Guide" section in each pathway |
| `/action` | `/voice` | Voice pathway IS the action center |
| `/resources` | `/services` + `/orgs` | Resource center = services + orgs directories |
| `/governance` | `/voice` | Section within Voice pathway |
| `/call-your-senators` | `/voice#contact` | Contact tool within Voice pathway |
| `/explore` | Pathway chapters | Exploration happens within pathway chapters |
| `/explore/focus/[id]` | Pathway chapters | Focus areas appear as sub-filters in pathways |
| `/explore/knowledge-base` | `/news` or pathway chapters | Knowledge base = guide content |
| `/library` | `/news?type=report` | Library = reports/docs filter in news/content |
| `/library/category/[slug]` | Pathway chapters | Category = pathway |
| `/library/doc/[id]` | `/content/[id]` | Docs are content. Same detail page. |
| `/library/chat` | `/chat` | Single chat entry point |
| `/guides` | Pathway chapters | Guides appear as content type within pathways |
| `/guides/[slug]` | `/content/[id]` | Guide detail = content detail with GUIDE badge |
| `/learn` | Pathway chapters | Learning paths within pathway "Go Deeper" trail level |
| `/learn/[id]` | `/content/[id]` | Learning path detail → content detail |
| `/learning-paths` | Pathway chapters | Learning journeys within pathways |
| `/learning-paths/[id]` | `/content/[id]` | Detail → content detail |
| `/collections` | `/my-plan` or pathway | Curated collections → pathway "Start Here" lists |
| `/collections/[id]` | `/my-plan` or pathway | Collection detail → curated list |
| `/sdgs` | `/about#sdgs` | SDG mapping → section in About |
| `/data` | `/about#data` | Open data → section in About |
| `/community` | `/` (homepage) | Community entry = homepage |
| `/geography` | `/map` | Geography explorer = map view |
| `/my-neighborhood` | `/neighborhoods/[id]` | Personalized → redirect to user's neighborhood |
| `/my-area` | `/my-plan` | Personal civic profile → My Plan |
| `/dashboard-live` | `/about#dashboard` | Live stats → section in About |
| `/compass` | `/start` | Civic compass → resource finder wizard |
| `/knowledge-graph` | Retired | Low-value, high-complexity |

### RETIRE (redirect to relevant page, delete code)

| Current Route | Redirect To | Reason |
|---|---|---|
| `/home` | `/` | Duplicate |
| `/exchange` | `/` | Duplicate |
| `/guide` | `/` | Duplicate |
| `/personas` | `/start` | Replaced by wizard |
| `/journey` | `/start` | Replaced by wizard |
| `/journey/[archetype]` | `/start` | Replaced by wizard + pathway chapters |
| `/for/[slug]` | `/start` | Audience pages → wizard handles personalization |
| `/quizzes` | `/start` | Was already a redirect |
| `/coming-soon` | `/` | Placeholder |
| `/account-locked` | `/` | Keep if auth needed, otherwise retire |
| `/goodthings` | `/news` | Three good things → news feed |
| `/stories` | `/news?type=story` | Stories = content type in news |
| `/stories/[id]` | `/content/[id]` | Story detail = content detail |
| `/adventures` | Retire | Interactive adventures → future feature |
| `/adventures/[slug]` | Retire | Future feature |
| `/foundations` | `/orgs?type=foundation` | Foundations = org type filter |
| `/manual` | `/about#how-it-works` | User manual → about section |
| `/faq` | `/about#faq` | FAQ → about section |
| `/glossary` | `/about#glossary` | Glossary → about section |

---

## REDIRECT MAP (for next.config.js)

```javascript
const redirects = [
  // Renames
  { source: '/organizations', destination: '/orgs', permanent: true },
  { source: '/organizations/:id', destination: '/orgs/:id', permanent: true },
  { source: '/pathways/:slug', destination: '/:slug', permanent: true },
  { source: '/me', destination: '/my-plan', permanent: true },
  { source: '/me/settings', destination: '/my-plan/settings', permanent: true },

  // Absorptions
  { source: '/centers', destination: '/', permanent: true },
  { source: '/centers/:slug', destination: '/', permanent: true },
  { source: '/learning', destination: '/', permanent: true },
  { source: '/action', destination: '/voice', permanent: true },
  { source: '/resources', destination: '/services', permanent: true },
  { source: '/governance', destination: '/voice', permanent: true },
  { source: '/call-your-senators', destination: '/voice', permanent: true },
  { source: '/explore', destination: '/', permanent: true },
  { source: '/explore/focus/:id', destination: '/', permanent: true },
  { source: '/explore/knowledge-base', destination: '/news', permanent: true },
  { source: '/library', destination: '/news', permanent: true },
  { source: '/library/category/:slug', destination: '/news', permanent: true },
  { source: '/library/doc/:id', destination: '/content/:id', permanent: true },
  { source: '/library/chat', destination: '/chat', permanent: true },
  { source: '/guides', destination: '/news', permanent: true },
  { source: '/guides/:slug', destination: '/content/:slug', permanent: true },
  { source: '/learn', destination: '/', permanent: true },
  { source: '/learn/:id', destination: '/content/:id', permanent: true },
  { source: '/learning-paths', destination: '/', permanent: true },
  { source: '/learning-paths/:id', destination: '/content/:id', permanent: true },
  { source: '/collections', destination: '/my-plan', permanent: true },
  { source: '/collections/:id', destination: '/my-plan', permanent: true },
  { source: '/compass', destination: '/start', permanent: true },
  { source: '/knowledge-graph', destination: '/', permanent: true },
  { source: '/community', destination: '/', permanent: true },
  { source: '/geography', destination: '/map', permanent: true },
  { source: '/my-neighborhood', destination: '/neighborhoods', permanent: true },
  { source: '/my-area', destination: '/my-plan', permanent: true },
  { source: '/dashboard-live', destination: '/about', permanent: true },
  { source: '/sdgs', destination: '/about', permanent: true },
  { source: '/data', destination: '/about', permanent: true },

  // Entity consolidation
  { source: '/agencies', destination: '/orgs', permanent: true },
  { source: '/agencies/:id', destination: '/orgs/:id', permanent: true },
  { source: '/foundations', destination: '/orgs', permanent: true },
  { source: '/foundations/:id', destination: '/orgs/:id', permanent: true },
  { source: '/benefits', destination: '/services', permanent: true },
  { source: '/benefits/:id', destination: '/services/:id', permanent: true },
  { source: '/municipal-services', destination: '/services', permanent: true },
  { source: '/municipal-services/:id', destination: '/services/:id', permanent: true },
  { source: '/campaigns', destination: '/opportunities', permanent: true },
  { source: '/campaigns/:id', destination: '/opportunities/:id', permanent: true },
  { source: '/events', destination: '/calendar', permanent: true },
  { source: '/events/:id', destination: '/calendar/:id', permanent: true },
  { source: '/super-neighborhoods', destination: '/neighborhoods', permanent: true },
  { source: '/super-neighborhoods/:id', destination: '/neighborhoods/:id', permanent: true },
  { source: '/districts', destination: '/voice', permanent: true },
  { source: '/tirz', destination: '/neighborhood', permanent: true },
  { source: '/tirz/:id', destination: '/neighborhoods/:id', permanent: true },
  { source: '/candidates', destination: '/elections', permanent: true },
  { source: '/candidates/:id', destination: '/elections', permanent: true },
  { source: '/ballot', destination: '/elections', permanent: true },
  { source: '/polling-places', destination: '/elections', permanent: true },

  // Retirements
  { source: '/home', destination: '/', permanent: true },
  { source: '/exchange', destination: '/', permanent: true },
  { source: '/guide', destination: '/', permanent: true },
  { source: '/personas', destination: '/start', permanent: true },
  { source: '/journey', destination: '/start', permanent: true },
  { source: '/journey/:archetype', destination: '/start', permanent: true },
  { source: '/for/:slug', destination: '/start', permanent: true },
  { source: '/quizzes', destination: '/start', permanent: true },
  { source: '/coming-soon', destination: '/', permanent: true },
  { source: '/goodthings', destination: '/news', permanent: true },
  { source: '/stories', destination: '/news', permanent: true },
  { source: '/stories/:id', destination: '/content/:id', permanent: true },
  { source: '/adventures', destination: '/', permanent: true },
  { source: '/adventures/:slug', destination: '/', permanent: true },
  { source: '/manual', destination: '/about', permanent: true },
  { source: '/faq', destination: '/about', permanent: true },
  { source: '/glossary', destination: '/about', permanent: true },
  { source: '/bookshelf', destination: '/my-plan', permanent: true },
  { source: '/teens', destination: '/start', permanent: true },
]
```

---

## FINAL PAGE COUNT

| Category | Pages | Routes |
|---|---|---|
| Homepage | 1 | `/` |
| Wizard | 1 | `/start` |
| Pathway chapters | 7 | `/health`, `/families`, etc. |
| Entity directories | 5 | `/orgs`, `/services`, `/officials`, `/policies`, `/opportunities` |
| Entity detail | 6 | `/orgs/[slug]`, `/services/[id]`, `/officials/[id]`, `/policies/[id]`, `/opportunities/[id]`, `/content/[id]` |
| Elections | 3 | `/elections`, `/elections/[id]`, `/elections/candidates/[id]` |
| Geography | 3 | `/map`, `/neighborhoods`, `/neighborhoods/[id]` |
| Tools | 3 | `/officials/lookup`, `/calendar`, `/chat` |
| User | 3 | `/my-plan`, `/my-plan/settings`, `/my-plan/submit` |
| Browse | 2 | `/news`, `/search` |
| Help | 2 | `/help`, `/help/[slug]` |
| Info | 4 | `/about`, `/contact`, `/privacy`, `/terms`, `/accessibility` |
| **Total** | **~43** | Down from 103 |

103 routes → 43 routes. 60% reduction. Every piece of content has a home.
