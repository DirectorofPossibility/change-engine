# The Change Engine — Field Guide Wireframe v3
## "The Lonely Planet of Houston Civic Life"

> A travel guide to 10,000+ free resources offered by thousands of organizations,
> anchored to your neighborhood, organized along 7 pathways.

---

## Design Philosophy

### What This IS
- A **field guide** — like Sibley's birds or Lonely Planet's cities
- Organizations are the **spine** (like restaurants/hotels in a travel guide)
- Geography is the **"you are here" pin** (like a travel guide's maps)
- Pathways are the **chapters** (like a guide's themed sections)
- The user is a **traveler** exploring their own city's civic landscape

### What This IS NOT
- A government portal (no bureaucratic language)
- A phonebook (no endless lists without context)
- A news site (news supports the guide, doesn't lead it)
- A dashboard (data supports navigation, doesn't replace it)

### Houston Design Principles
1. **Menil Quiet** — no grand entrance, let content speak
2. **Bayou Flow** — everything connects through meandering paths
3. **No-Zoning Mix** — content types intermingle naturally (clinic next to job fair next to park event)
4. **Space City Precision** — monospace labels, data-forward, evidence-based
5. **Ward Warmth** — terracotta accents, shotgun house horizontal rhythm, community voice

### Color System (Houston-Rooted)
```
Primary:     Bayou Deep #1b5e8a    (Buffalo Bayou at dusk)
Accent:      Clay #C4663A          (Third Ward brick)
Background:  Paper #f4f5f7         (Gulf coast overcast sky)
Text:        Ink #0d1117           (Night skyline)

Pathway Colors (already exist):
  Health:       Bayou Green    #1a6b56
  Families:     Deep Blue      #1e4d7a
  Neighborhood: Ward Purple    #4a2870
  Voice:        Voice Red      #7a2018
  Money:        Money Gold     #6a4e10
  Planet:       Planet Green   #1a5030
  Bigger We:    Bigger Blue    #1a3460
```

---

## SITEMAP — Simplified

The current site has 60+ page routes. The guide collapses these into a clear hierarchy:

```
/                           → Guide Cover (homepage)
/start                      → Resource Finder Wizard (3-step onramp)

/[pathway-slug]             → Pathway Chapter (7 chapters)
  e.g. /health, /families, /neighborhood, /voice, /money, /planet, /the-bigger-we

/orgs                       → Organization Directory (the spine)
/orgs/[slug]                → Organization Profile (the listing)

/services                   → Service Directory
/services/[id]              → Service Detail

/officials                  → Officials Directory
/officials/[id]             → Official Profile

/policies                   → Policy Tracker
/policies/[id]              → Policy Detail

/opportunities              → Opportunities Board
/opportunities/[id]         → Opportunity Detail

/content/[id]               → Article/Report/Guide Detail
/news                       → What's New Feed

/map                        → Full Map View (all resources)
/neighborhoods              → Neighborhood Chapters
/neighborhoods/[id]         → Neighborhood Guide

/my-plan                    → Saved Resources + Notes (was /me)
/calendar                   → Civic Calendar (seasonal/deadline-aware)

/about                      → About
/search                     → Search
```

**What collapsed:**
- `/centers/*` → absorbed into pathway chapters (centers are a classification axis, not a navigation layer)
- `/journey/*` → replaced by `/start` wizard + pathway entry
- `/pathways/*` → promoted to top-level `/[pathway-slug]`
- `/explore/*`, `/compass`, `/knowledge-graph` → absorbed into pathway chapters
- `/me` → `/my-plan` (reframed as "my civic plan" not "my account")

---

## PAGE WIREFRAMES

---

### 1. HOMEPAGE — "Guide Cover"

The homepage is the cover + table of contents of the field guide.
Not a marketing page. Not a dashboard. A **doorway into exploration**.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ┌─ TOP BAR ───────────────────────────────────────────────────────┐  │
│ │ [CE Logo]  [Search... 🔍]        [ZIP: 77004 ▾]  [My Plan] [≡] │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ HERO — "Your Field Guide to Houston" ──────────────────────────┐  │
│ │                                                                  │  │
│ │  THE CHANGE ENGINE                                               │  │
│ │  ─────────────────                                               │  │
│ │  A field guide to 10,247 free resources                          │  │
│ │  from 1,832 organizations across Greater Houston.                │  │
│ │                                                                  │  │
│ │  [What do you need? → Start here]                                │  │
│ │                                                                  │  │
│ │  ┌──────────────────────────────────────────────────────┐        │  │
│ │  │     📍 Showing resources near 77004 — Third Ward     │        │  │
│ │  │        Greater Third Ward · Houston · Harris County   │        │  │
│ │  │        [Change ZIP]                                   │        │  │
│ │  └──────────────────────────────────────────────────────┘        │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ SEVEN PATHWAYS — "Table of Contents" ──────────────────────────┐  │
│ │                                                                  │  │
│ │  Explore by pathway                                              │  │
│ │  ──────────────────                                              │  │
│ │                                                                  │  │
│ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │  │
│ │  │ █ HEALTH    │ │ █ FAMILIES  │ │ █ NEIGHBOR-  │                │  │
│ │  │             │ │             │ │   HOOD       │                │  │
│ │  │ 1,847 rsrcs │ │ 1,203 rsrcs │ │ 956 rsrcs   │                │  │
│ │  │ 312 orgs    │ │ 241 orgs    │ │ 189 orgs     │                │  │
│ │  │             │ │             │ │              │                │  │
│ │  │ Start here →│ │ Start here →│ │ Start here → │                │  │
│ │  └─────────────┘ └─────────────┘ └─────────────┘                │  │
│ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │  │
│ │  │ █ VOICE     │ │ █ MONEY     │ │ █ PLANET    │ │ █ BIGGER  │  │  │
│ │  │ 723 rsrcs   │ │ 614 rsrcs   │ │ 412 rsrcs  │ │   WE      │  │  │
│ │  │ 156 orgs    │ │ 134 orgs    │ │ 98 orgs    │ │ 892 rsrcs │  │  │
│ │  │ Start here →│ │ Start here →│ │ Start here→│ │ Start → │    │  │
│ │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ "START HERE" — Top Picks Near You ─────────────────────────────┐  │
│ │                                                                  │  │
│ │  If you're new, start here                                       │  │
│ │  ────────────────────────                                        │  │
│ │  The 5 resources most people in 77004 need first.                │  │
│ │                                                                  │  │
│ │  ┌─────────────────────────────────────────────────────┐         │  │
│ │  │ 1. [Org Logo]  Houston Area Urban League             │         │  │
│ │  │    Job training, housing counseling, youth programs   │         │  │
│ │  │    📍 0.4 mi · Third Ward                             │         │  │
│ │  │    [Newsletter] [Volunteer] [View Guide →]            │         │  │
│ │  ├─────────────────────────────────────────────────────┤         │  │
│ │  │ 2. [Org Logo]  Harris Health System — MLK Clinic     │         │  │
│ │  │    Primary care, sliding scale, walk-ins welcome      │         │  │
│ │  │    📍 0.8 mi · Mon-Fri 8-5                            │         │  │
│ │  │    [Save to Plan] [Get Directions] [View Guide →]     │         │  │
│ │  ├─────────────────────────────────────────────────────┤         │  │
│ │  │ 3. [Org Logo]  Houston Food Bank — Pantry Locator    │         │  │
│ │  │    Free groceries, no ID required, multiple locations  │         │  │
│ │  │    📍 1.2 mi · Next distribution: Sat 9am             │         │  │
│ │  │    [Volunteer] [View Guide →]                          │         │  │
│ │  ├─────────────────────────────────────────────────────┤         │  │
│ │  │ 4. ...                                                │         │  │
│ │  │ 5. ...                                                │         │  │
│ │  └─────────────────────────────────────────────────────┘         │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ WHAT'S HAPPENING — Timely & Seasonal ──────────────────────────┐  │
│ │                                                                  │  │
│ │  Right now in Houston                                            │  │
│ │  ────────────────────                                            │  │
│ │                                                                  │  │
│ │  ⏰ DEADLINE    Tax prep assistance ends April 15                │  │
│ │                 → 12 free VITA sites near you                    │  │
│ │                                                                  │  │
│ │  📅 THIS WEEK   City Council votes on Complete Streets           │  │
│ │                 → Track this policy · Find your council member   │  │
│ │                                                                  │  │
│ │  🌡️  SEASONAL   Cooling centers open through September           │  │
│ │                 → 8 locations in your area                       │  │
│ │                                                                  │  │
│ │  [See full civic calendar →]                                     │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ YOUR NEIGHBORHOOD — Geographic Context ────────────────────────┐  │
│ │                                                                  │  │
│ │  Third Ward at a glance                                          │  │
│ │  ──────────────────────                                          │  │
│ │                                                                  │  │
│ │  ┌────────────────────┐  Organizations: 47                       │  │
│ │  │                    │  Services: 123                           │  │
│ │  │   [MINI MAP]       │  Elected officials: 8                    │  │
│ │  │   Third Ward       │  Active policies: 12                     │  │
│ │  │   highlighted      │  Upcoming events: 5                      │  │
│ │  │                    │                                          │  │
│ │  └────────────────────┘  [Explore your neighborhood →]           │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ WHAT'S NEW — Latest from the Guide ────────────────────────────┐  │
│ │                                                                  │  │
│ │  ┌──────────────────────────┐  ┌─────────────────┐               │  │
│ │  │ [FEATURED IMAGE]         │  │ REPORT           │               │  │
│ │  │                          │  │ Title...          │               │  │
│ │  │ ARTICLE · Health         │  │ 📄 [PDF]          │               │  │
│ │  │ Title of feature...      │  ├─────────────────┤               │  │
│ │  │ 2-line summary           │  │ EVENT            │               │  │
│ │  │                          │  │ Title...          │               │  │
│ │  │                          │  │ Mar 22 · RSVP    │               │  │
│ │  └──────────────────────────┘  ├─────────────────┤               │  │
│ │                                │ VIDEO            │               │  │
│ │                                │ Title...          │               │  │
│ │                                │ ▶ 4:30           │               │  │
│ │                                └─────────────────┘               │  │
│ │                                                                  │  │
│ │  [All updates →]                                                 │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ TRUST STRIP ───────────────────────────────────────────────────┐  │
│ │  10,247 resources · 1,832 orgs · 4 levels of government         │  │
│ │  Updated daily · 3 languages · Free forever · Zero ads          │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ FOOTER ────────────────────────────────────────────────────────┐  │
│ │  About · Privacy · Terms · Contact · Accessibility              │  │
│ │  Available in: English · Español · Tiếng Việt                   │  │
│ │  A project of The Change Lab · Houston, TX                      │  │
│ └─────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Key decisions:**
- The Flower of Life (FOL) is retired from the homepage. It's beautiful but doesn't help people find resources.
- Pathways are the primary navigation (like chapters in a travel guide)
- "Start Here" list is the single most important pattern (from Lonely Planet's "Don't Miss")
- Geography context is always visible
- Content types get badges (ARTICLE, REPORT, EVENT, VIDEO, PDF)

---

### 2. RESOURCE FINDER WIZARD — "/start"

The Merlin Bird ID pattern: 3-5 questions → ranked matches.
This is the **highest-impact page for new visitors**.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Find what you need                                                  │
│  ──────────────────                                                  │
│  Answer a few questions. We'll show you what's available.            │
│                                                                      │
│  STEP 1 of 3                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│                                                                      │
│  What brings you here today?                                         │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ 🏥 Health &       │  │ 👨‍👩‍👧 Family &     │  │ 🏘️ My             │
│  │    Wellbeing      │  │    Children      │  │   Neighborhood   │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ 🗳️ Civic Voice    │  │ 💰 Money &       │  │ 🌍 Environment    │
│  │    & Government   │  │    Work          │  │   & Planet       │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│  ┌──────────────────┐                                                │
│  │ 🤝 Community &    │                                               │
│  │    Connection     │                                               │
│  └──────────────────┘                                                │
│                                                                      │
│                                                                      │
│  ── STEP 2 ──────────────────────────────────────────────────────    │
│                                                                      │
│  Where are you?                                                      │
│                                                                      │
│  [Enter ZIP code ___________]  or  [📍 Use my location]             │
│                                                                      │
│                                                                      │
│  ── STEP 3 ──────────────────────────────────────────────────────    │
│                                                                      │
│  Any of these apply to you? (optional, select all that apply)        │
│                                                                      │
│  [ ] Veteran       [ ] Senior (60+)    [ ] Has disability           │
│  [ ] Uninsured     [ ] Low income      [ ] Immigrant/refugee        │
│  [ ] Parent        [ ] Student         [ ] Currently homeless       │
│  [ ] Re-entering from incarceration    [ ] Speak Spanish            │
│  [ ] Speak Vietnamese                  [ ] Other language           │
│                                                                      │
│  [Show my results →]                                                 │
│                                                                      │
│                                                                      │
│  ── RESULTS ─────────────────────────────────────────────────────    │
│                                                                      │
│  12 resources match near 77004                                       │
│  Sorted by: [Nearest ▾]   View: [List] [Map]                        │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐       │
│  │ [Logo]  Avenue 360 Health & Wellness               0.3 mi │       │
│  │ ──────────────────────────────────────────────────────     │       │
│  │ Primary care, behavioral health, HIV services              │       │
│  │ Sliding scale · Walk-ins welcome · EN/ES                   │       │
│  │ Mon-Fri 8am-6pm · Sat 9am-1pm                             │       │
│  │                                                            │       │
│  │ [Save to Plan]  [Get Directions]  [Call: 713-xxx-xxxx]     │       │
│  │                                                            │       │
│  │ From this org:                                             │       │
│  │  · Dental clinic (walk-in Tue/Thu)                         │       │
│  │  · Ryan White HIV case management                          │       │
│  │  · Behavioral health counseling                            │       │
│  │                                                            │       │
│  │ [Newsletter ✉️]  [Volunteer 🤝]  [Donate 💛]                │       │
│  │                                                            │       │
│  │ ▸ View full guide page →                                   │       │
│  └───────────────────────────────────────────────────────────┘       │
│  ┌───────────────────────────────────────────────────────────┐       │
│  │ [Logo]  Houston Area Women's Center                0.8 mi │       │
│  │ ...                                                        │       │
│  └───────────────────────────────────────────────────────────┘       │
│                                                                      │
│  Also consider:                                                      │
│  · 211 Texas (dial 2-1-1) — 24/7 helpline for any need              │
│  · BakerRipley — multi-service hub in your area                      │
│  · United Way of Greater Houston — referral network                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 3. PATHWAY CHAPTER PAGE — "/health"

Each pathway is a **chapter in the guide** — like "Rome" or "Florence" in a Lonely Planet Italy.
Contains: overview → "start here" picks → orgs → services → policies → officials → content.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│ ┌─ PATHWAY HEADER ────────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  █ left accent bar (pathway color: #1a6b56)                      │  │
│ │                                                                  │  │
│ │  PATHWAY 1 OF 7                                                  │  │
│ │                                                                  │  │
│ │  Health & Wellbeing                                              │  │
│ │  ──────────────────                                              │  │
│ │  How is your community's health? What support exists?            │  │
│ │                                                                  │  │
│ │  📍 Filtered to 77004 — Third Ward    [Change ZIP]               │  │
│ │                                                                  │  │
│ │  312 organizations · 847 services · 34 officials · 89 policies   │  │
│ │  Near you: 28 orgs · 67 services                                 │  │
│ │                                                                  │  │
│ │  [Find resources →]   [Browse map →]                             │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ IN THIS CHAPTER (sticky sidebar on desktop) ───────────────────┐  │
│ │  · Start Here                                                    │  │
│ │  · Organizations (312)                                           │  │
│ │  · Services (847)                                                │  │
│ │  · Who Represents You (34)                                       │  │
│ │  · Policy Tracker (89)                                           │  │
│ │  · Opportunities (23)                                            │  │
│ │  · From the Guide (articles, reports, videos)                    │  │
│ │  · Related Pathways                                              │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ START HERE — Don't Miss ───────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  If you need health support, start with these:                   │  │
│ │                                                                  │  │
│ │  1. Harris Health System        Free/low-cost medical care       │  │
│ │     → Gold Card financial assistance program                     │  │
│ │     📍 Nearest clinic: 0.8 mi · MLK Health Center                │  │
│ │                                                                  │  │
│ │  2. Healthcare.gov enrollment   Open enrollment Nov-Jan          │  │
│ │     → Free navigators help you apply                             │  │
│ │     [📄 Download checklist (PDF)]                                 │  │
│ │                                                                  │  │
│ │  3. Mental Health America       Free screenings, crisis support  │  │
│ │     → Text HOME to 741741 (24/7 crisis line)                     │  │
│ │                                                                  │  │
│ │  4. WIC (Women, Infants, Children)   Nutrition + formula         │  │
│ │     → 4 locations near you                                       │  │
│ │                                                                  │  │
│ │  5. Avenue 360 Health           Walk-in primary care             │  │
│ │     → Sliding scale · No insurance needed                        │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ ORGANIZATIONS — The Spine ─────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  312 organizations on this pathway                               │  │
│ │  [Near you ▾]  [All Greater Houston ▾]                           │  │
│ │                                                                  │  │
│ │  ┌──────────────────────────────────────────────────────┐        │  │
│ │  │ [Logo]  Texas Children's Hospital                     │        │  │
│ │  │ Pediatric care, research, community health outreach   │        │  │
│ │  │ 📍 2.1 mi · 14 services listed                        │        │  │
│ │  │ [Newsletter ✉️] [Volunteer 🤝] [Donate 💛] [Guide →]   │        │  │
│ │  ├──────────────────────────────────────────────────────┤        │  │
│ │  │ [Logo]  Legacy Community Health                       │        │  │
│ │  │ Primary care, dental, pharmacy, behavioral health     │        │  │
│ │  │ 📍 0.6 mi · 8 services listed                         │        │  │
│ │  │ [Newsletter ✉️] [Volunteer 🤝] [Guide →]               │        │  │
│ │  ├──────────────────────────────────────────────────────┤        │  │
│ │  │ ...                                                   │        │  │
│ │  └──────────────────────────────────────────────────────┘        │  │
│ │                                                                  │  │
│ │  [Show all 312 organizations →]                                  │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ SERVICES — What's Available ───────────────────────────────────┐  │
│ │                                                                  │  │
│ │  67 services near 77004  ·  847 across Greater Houston           │  │
│ │  Filter: [Category ▾] [Free only ☐] [Walk-in ☐] [Language ▾]    │  │
│ │                                                                  │  │
│ │  View: [List] [Map]                                              │  │
│ │                                                                  │  │
│ │  ┌──────────────────────────────────────────────────────┐        │  │
│ │  │  MLK Health Center — Primary Care          0.8 mi    │        │  │
│ │  │  Harris Health System                                 │        │  │
│ │  │  Who: Anyone · Cost: Free w/ Gold Card                │        │  │
│ │  │  Hours: Mon-Fri 8-5 · Walk-in OK                      │        │  │
│ │  │  Languages: EN, ES, VI                                │        │  │
│ │  │  [Save] [Directions] [Call]                           │        │  │
│ │  ├──────────────────────────────────────────────────────┤        │  │
│ │  │  ...                                                  │        │  │
│ │  └──────────────────────────────────────────────────────┘        │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ WHO REPRESENTS YOU ────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  Your elected officials on health policy (based on 77004)        │  │
│ │                                                                  │  │
│ │  FEDERAL                                                         │  │
│ │  ┌────────────────────────────────────────────────┐              │  │
│ │  │ [Photo] Rep. Sheila Jackson Lee  (TX-18)       │              │  │
│ │  │ Cmte: Budget, Judiciary                         │              │  │
│ │  │ [Contact] [Voting Record] [Profile →]           │              │  │
│ │  └────────────────────────────────────────────────┘              │  │
│ │                                                                  │  │
│ │  STATE                                                           │  │
│ │  ┌────────────────────────────────────────────────┐              │  │
│ │  │ [Photo] Sen. Borris Miles  (SD-13)             │              │  │
│ │  │ Cmte: Health & Human Services                   │              │  │
│ │  │ [Contact] [Bills] [Profile →]                   │              │  │
│ │  └────────────────────────────────────────────────┘              │  │
│ │                                                                  │  │
│ │  CITY                                                            │  │
│ │  ...                                                             │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ POLICY TRACKER ────────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  89 health-related policies tracked                              │  │
│ │                                                                  │  │
│ │  ┌────────────────────────────────────────────────────┐          │  │
│ │  │  HB 1234 — Maternal Health Coverage Expansion      │          │  │
│ │  │  TX State · In Committee · Last action: Mar 8      │          │  │
│ │  │  What it means: Extends postpartum Medicaid from   │          │  │
│ │  │  2 months to 12 months for new mothers.            │          │  │
│ │  │  [Track this policy] [Full details →]              │          │  │
│ │  ├────────────────────────────────────────────────────┤          │  │
│ │  │  ...                                               │          │  │
│ │  └────────────────────────────────────────────────────┘          │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ OPPORTUNITIES — Get Involved ──────────────────────────────────┐  │
│ │                                                                  │  │
│ │  ┌────────────────────────────────────────────────────┐          │  │
│ │  │  VOLUNTEER · Houston Food Bank                     │          │  │
│ │  │  Sort & pack food donations                        │          │  │
│ │  │  Every Saturday 9am-12pm · Portwall St             │          │  │
│ │  │  [Sign up →]                                       │          │  │
│ │  └────────────────────────────────────────────────────┘          │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ FROM THE GUIDE — Articles, Reports, Videos ────────────────────┐  │
│ │                                                                  │  │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│ │  │ ARTICLE  │ │ REPORT   │ │ VIDEO    │ │ GUIDE    │            │  │
│ │  │ [image]  │ │ [image]  │ │ [thumb]  │ │ [image]  │            │  │
│ │  │ Title    │ │ Title    │ │ Title    │ │ Title    │            │  │
│ │  │ Source   │ │ 📄 PDF    │ │ ▶ 6:30   │ │ 5 steps  │            │  │
│ │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ RELATED PATHWAYS ──────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  Health connects to:                                             │  │
│ │  █ Families — child health, maternal care                        │  │
│ │  █ Money — insurance, medical debt, HSA                          │  │
│ │  █ Neighborhood — environmental health, food deserts             │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 4. ORGANIZATION PROFILE — "/orgs/[slug]"

This is the **listing page** — the heart of the guide, like a restaurant entry in Lonely Planet.
Every org is a chapter in the guide. The org page IS the resource.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ← Health pathway                     [Save to Plan] [Share]         │
│                                                                      │
│ ┌─ ORG HEADER ────────────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  [ORG LOGO - 80px]                                               │  │
│ │                                                                  │  │
│ │  Legacy Community Health                                         │  │
│ │  ──────────────────────                                          │  │
│ │  Comprehensive community health center providing primary care,   │  │
│ │  dental, pharmacy, and behavioral health services to underserved │  │
│ │  communities across Greater Houston.                             │  │
│ │                                                                  │  │
│ │  ┌─────────────────────────────────────────────────────────┐     │  │
│ │  │  [✉️ Newsletter]    [🤝 Volunteer]    [💛 Donate]         │     │  │
│ │  └─────────────────────────────────────────────────────────┘     │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ MAIN CONTENT (left 65%) ──────┐ ┌─ SIDEBAR (right 35%) ───────┐  │
│ │                                 │ │                              │  │
│ │ AT A GLANCE                     │ │  CONTACT                     │  │
│ │ ───────────                     │ │  ────────                    │  │
│ │ Founded: 1981                   │ │  📞 713-830-3000             │  │
│ │ People served: 250,000/yr       │ │  🌐 legacycommunityhealth.org│  │
│ │ Locations: 42 across Houston    │ │  ✉️ info@legacy.org           │  │
│ │ Languages: EN, ES, VI, ZH, AR  │ │                              │  │
│ │ Type: FQHC (Federally           │ │  📍 NEAREST LOCATION         │  │
│ │   Qualified Health Center)      │ │  1415 Fannin St (1.2 mi)    │  │
│ │                                 │ │  Mon-Fri 8am-6pm            │  │
│ │                                 │ │  Sat 9am-1pm                │  │
│ │ SERVICES (8)                    │ │  [Get Directions]           │  │
│ │ ─────────                       │ │                              │  │
│ │                                 │ │  ┌──────────────────────┐   │  │
│ │ ┌──────────────────────────┐    │ │  │   [MINI MAP]          │   │  │
│ │ │ Primary Care              │    │ │  │   showing location    │   │  │
│ │ │ Walk-in & appointment     │    │ │  │                       │   │  │
│ │ │ Sliding scale · No ins.   │    │ │  └──────────────────────┘   │  │
│ │ │ required                  │    │ │                              │  │
│ │ │ [Details →]               │    │ │  PATHWAYS                   │  │
│ │ ├──────────────────────────┤    │ │  ────────                    │  │
│ │ │ Dental Care               │    │ │  █ Health                   │  │
│ │ │ Cleanings, fillings,      │    │ │  █ Families                 │  │
│ │ │ extractions               │    │ │                              │  │
│ │ │ [Details →]               │    │ │  ALSO CONSIDER              │  │
│ │ ├──────────────────────────┤    │ │  ──────────────              │  │
│ │ │ Behavioral Health         │    │ │  · Avenue 360 Health        │  │
│ │ │ ...                       │    │ │  · Baylor St. Luke's        │  │
│ │ │ [Details →]               │    │ │  · Harris Health System     │  │
│ │ ├──────────────────────────┤    │ │                              │  │
│ │ │ Pharmacy                  │    │ │                              │  │
│ │ │ ...                       │    │ │                              │  │
│ │ ├──────────────────────────┤    │ │                              │  │
│ │ │ + 4 more services         │    │ │                              │  │
│ │ └──────────────────────────┘    │ │                              │  │
│ │                                 │ │                              │  │
│ │ OPPORTUNITIES                   │ │                              │  │
│ │ ─────────────                   │ │                              │  │
│ │ ┌──────────────────────────┐    │ │                              │  │
│ │ │ VOLUNTEER                 │    │ │                              │  │
│ │ │ Community Health Worker   │    │ │                              │  │
│ │ │ training program          │    │ │                              │  │
│ │ │ Starts April 2026         │    │ │                              │  │
│ │ │ [Apply →]                 │    │ │                              │  │
│ │ └──────────────────────────┘    │ │                              │  │
│ │                                 │ │                              │  │
│ │ FROM THE GUIDE                  │ │                              │  │
│ │ ──────────────                  │ │                              │  │
│ │ ┌────────┐ ┌────────┐          │ │                              │  │
│ │ │ARTICLE │ │REPORT  │          │ │                              │  │
│ │ │Title.. │ │Title.. │          │ │                              │  │
│ │ │Source  │ │📄 PDF   │          │ │                              │  │
│ │ └────────┘ └────────┘          │ │                              │  │
│ │                                 │ │                              │  │
│ └─────────────────────────────────┘ └──────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key decisions on org page:**
- **Newsletter / Volunteer / Donate buttons are PROMINENT** — top of page, always visible
- These only appear if the org has those URLs in the database
- Services listed inline with the org (not separate pages you have to navigate to)
- "Also Consider" sidebar (field guide "similar species" pattern)
- PDF/resource links go DIRECTLY to the resource, not to an intermediary page
- Map shows nearest location to user's ZIP

---

### 5. STANDARDIZED RESOURCE CARD

Used everywhere in the guide — consistent format for scanability.
Like Sibley's bird entry: same structure, every time.

```
┌───────────────────────────────────────────────────────────────┐
│ [Org Logo]  Organization Name                       0.8 mi   │
│ ────────────────────────────────────────────────────────────  │
│ One-sentence plain-language description of what they offer.   │
│                                                               │
│ Who: Families under 200% FPL                                 │
│ Cost: Free                                                    │
│ Hours: Mon-Fri 9-5 · Walk-in OK                              │
│ Languages: EN, ES                                             │
│ ────────────────────────────────────────────────────────────  │
│ [Save to Plan]   [Get Directions]   [Call 713-xxx-xxxx]       │
│                                                               │
│ [Newsletter ✉️]  [Volunteer 🤝]  (if available)                │
└───────────────────────────────────────────────────────────────┘
```

**Content card variant (for articles, reports, videos):**

```
┌───────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                                  │
│ │ [IMAGE]  │  ARTICLE · Health · Houston Chronicle            │
│ │          │  Title of the article in plain language           │
│ │          │  2-line summary of what this means for you.       │
│ │          │  Mar 12, 2026                                     │
│ └──────────┘                                                  │
│ [Save] [Share]                                  [Read →]      │
└───────────────────────────────────────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────┐
│ 📄  REPORT · PDF · 24 pages                                   │
│ Title of the report                                           │
│ Published by: Rice Kinder Institute                           │
│ What's in it: 2-line summary                                  │
│ [Download PDF →]   [Save to Plan]                             │
└───────────────────────────────────────────────────────────────┘
```

Note: PDF links go DIRECTLY to the PDF. Not to a page about the PDF.

---

### 6. NAVIGATION — Top Bar

Simplified from 5-dropdown mega-nav to a clean field guide structure.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [CE Logo]   Pathways ▾   Orgs   Map   [🔍 Search]   77004 ▾   [≡]  │
│                                                                      │
│  Pathways dropdown:                                                  │
│  ┌────────────────────────────┐                                      │
│  │ █ Health & Wellbeing       │                                      │
│  │ █ Families & Children      │                                      │
│  │ █ Your Neighborhood        │                                      │
│  │ █ Civic Voice              │                                      │
│  │ █ Money & Work             │                                      │
│  │ █ Planet & Environment     │                                      │
│  │ █ The Bigger We            │                                      │
│  │ ──────────────────────     │                                      │
│  │ All pathways overview →    │                                      │
│  └────────────────────────────┘                                      │
│                                                                      │
│  Mobile: bottom tab bar                                              │
│  ┌──────────────────────────────────────────────┐                    │
│  │  [🏠 Home]  [📖 Pathways]  [🔍 Find]  [📍 Map]  [📋 Plan]  │       │
│  └──────────────────────────────────────────────┘                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**What changed:**
- 5 center dropdowns → 1 "Pathways" dropdown (chapters of the guide)
- "Orgs" gets a top-level spot (it's the spine of the guide)
- "Map" gets a top-level spot (geography is the anchor)
- ZIP is always visible
- "My Plan" replaces "My Account" (civic action framing)

---

### 7. MY PLAN — "/my-plan"

Replaces "/me". Reframed from "account page" to "my civic plan" —
like a travel itinerary you're building.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  My Plan                                                             │
│  ────────                                                            │
│  📍 77004 — Third Ward, Houston, TX                                  │
│                                                                      │
│ ┌─ SAVED RESOURCES ──────────────────────────────────────────────┐   │
│ │                                                                 │   │
│ │  ┌─ Health ────────────────────────────────────────────────┐    │   │
│ │  │  · Avenue 360 — Primary Care          [Note] [Remove]   │    │   │
│ │  │    "Called 3/12, appt scheduled 3/20"                    │    │   │
│ │  │  · Harris Health Gold Card            [Note] [Remove]   │    │   │
│ │  │  · Houston Food Bank — Pantry         [Note] [Remove]   │    │   │
│ │  └─────────────────────────────────────────────────────────┘    │   │
│ │                                                                 │   │
│ │  ┌─ Voice ─────────────────────────────────────────────────┐    │   │
│ │  │  · Rep. Sheila Jackson Lee            [Note] [Remove]   │    │   │
│ │  │  · HB 1234 — Maternal Health          [Note] [Remove]   │    │   │
│ │  └─────────────────────────────────────────────────────────┘    │   │
│ │                                                                 │   │
│ │  [View on map]  [Share my plan]                                 │   │
│ │                                                                 │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌─ UPCOMING ─────────────────────────────────────────────────────┐   │
│ │                                                                 │   │
│ │  Mar 20  Dr. appointment — Avenue 360 (you added this)          │   │
│ │  Mar 22  City Council hearing — Complete Streets (tracked)      │   │
│ │  Apr 15  DEADLINE: Tax prep assistance ends                     │   │
│ │                                                                 │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌─ YOUR REPRESENTATIVES ─────────────────────────────────────────┐   │
│ │  Federal: Sen. Cruz, Sen. Cornyn, Rep. Jackson Lee              │   │
│ │  State: Sen. Miles, Rep. Thompson                               │   │
│ │  City: CM Pollard (District D), Mayor Whitmire                  │   │
│ │  [See all officials →]                                          │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 8. MAP VIEW — "/map"

Dual browse mode (Google Maps pattern). Map + list synchronized.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [🔍 Search resources...]   Filter: [Pathway ▾] [Type ▾] [Open now] │
│                                                                      │
│ ┌─ MAP (60%) ──────────────────────┐ ┌─ LIST (40%) ──────────────┐  │
│ │                                   │ │                            │  │
│ │   ┌─────────────────────────┐     │ │  28 results near 77004     │  │
│ │   │                         │     │ │  Sorted by: Nearest ▾      │  │
│ │   │    [LEAFLET MAP]        │     │ │                            │  │
│ │   │    with clustered       │     │ │  ┌──────────────────────┐  │  │
│ │   │    resource pins        │     │ │  │ 1. Avenue 360  0.3mi │  │  │
│ │   │    color-coded by       │     │ │  │    Primary care      │  │  │
│ │   │    pathway              │     │ │  │    [Call] [Dir]      │  │  │
│ │   │                         │     │ │  ├──────────────────────┤  │  │
│ │   │    [pin] = org          │     │ │  │ 2. Legacy    0.6mi   │  │  │
│ │   │    [pin] = service      │     │ │  │    Dental, primary   │  │  │
│ │   │    [pin] = official     │     │ │  │    [Call] [Dir]      │  │  │
│ │   │                         │     │ │  ├──────────────────────┤  │  │
│ │   │                         │     │ │  │ 3. ...               │  │  │
│ │   │                         │     │ │  │                      │  │  │
│ │   └─────────────────────────┘     │ │  └──────────────────────┘  │  │
│ │                                   │ │                            │  │
│ └───────────────────────────────────┘ └────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## INGEST IMPLICATIONS

The user emphasized: **ingest must identify subject/content of the page**. Current ingest classifies across 16 taxonomy dimensions. What needs to change:

### Org Page Ingest — New Fields to Extract

When crawling an org's website, the ingest pipeline should extract:

```
From the org's homepage / about page:
├── newsletter_url        → "Subscribe" or "Newsletter" link
├── donate_url            → "Donate" or "Give" link
├── volunteer_url         → "Volunteer" or "Get Involved" link
├── social_links{}        → Twitter, Facebook, Instagram, LinkedIn, YouTube
├── logo_url              → <meta og:image> or header logo
└── mission_statement     → First paragraph or meta description

From subpages:
├── services[]            → /services, /programs, /what-we-do pages
├── resource_pdfs[]       → Direct PDF links (annual reports, guides, forms)
├── events_url            → /events or /calendar page
└── careers_url           → /jobs or /careers page
```

### Content Type Detection

Every ingested piece of content needs a `content_type` badge:

| Type | Detection Signal | Badge |
|------|-----------------|-------|
| `article` | News article, blog post | ARTICLE |
| `report` | PDF, whitepaper, research | REPORT · PDF |
| `video` | YouTube/Vimeo embed, .mp4 | VIDEO · ▶ duration |
| `event` | Date + location + RSVP | EVENT · date |
| `guide` | How-to, step-by-step | GUIDE · N steps |
| `tool` | Calculator, form, interactive | TOOL |
| `course` | Multi-session, curriculum | COURSE · duration |
| `campaign` | Call-to-action, petition, sign-up | CAMPAIGN |
| `dataset` | CSV, data portal, statistics | DATA |

### Resource Linking Rule

**CRITICAL**: When a resource IS a document (PDF, spreadsheet, form):
- Link to the **document itself**, not to the page that contains the document
- Store both: `source_url` (the page) and `resource_url` (the actual PDF/doc)
- Card shows `[Download PDF →]` linking to `resource_url`
- "Source" link goes to `source_url` for context

---

## COMPONENT MAPPING — What Changes

### New Components Needed
1. `ResourceFinderWizard` — 3-step wizard (/start)
2. `StartHereList` — curated "don't miss" picks per pathway
3. `OrgActionBar` — Newsletter / Volunteer / Donate buttons
4. `ResourceCard` — standardized card (replaces ContentCard + ServiceCard + etc.)
5. `ContentTypeBadge` — ARTICLE / REPORT / VIDEO / EVENT / etc.
6. `DualBrowse` — synchronized map + list view
7. `PlanSaver` — save to plan with notes
8. `CivicCalendar` — seasonal/deadline-aware timeline
9. `AlsoConsider` — "similar species" sidebar

### Components to Retire
1. `InteractiveFOL` — Flower of Life homepage hero (beautiful but not functional)
2. `CentersGrid` / `CenterDoorways` / `CenterCard` — centers absorbed into pathways
3. `CompassView` / `CompassEntry` — replaced by wizard
4. `ArchetypeSelector` / `PersonaSelector` — replaced by wizard
5. `HeroBook` — replaced by simpler pathway header
6. `WayfinderCircles` / `WayfinderNav` / `WayfinderPanel` — over-engineered navigation

### Components to Keep (rename where noted)
1. `ContentCard` → evolve into `ResourceCard`
2. `ServiceCard` → absorb into `ResourceCard`
3. `OfficialCard` → keep
4. `PolicyCard` → keep
5. `DetailPageLayout` → keep
6. `SearchBar` → keep
7. `TranslateWidget` → keep
8. `BookmarkButton` → rebrand as "Save to Plan"
9. `NeighborhoodMap` → keep
10. `Breadcrumb` → simplify
11. `D2Footer` → simplify

---

## INFORMATION ARCHITECTURE — The Guide Metaphor

```
THE CHANGE ENGINE
A Field Guide to Greater Houston
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONT MATTER
  Cover .......................... Homepage
  How to Use This Guide ......... /start (wizard)
  Your Location ................. ZIP → neighborhood context

CHAPTERS (Pathways)
  1. Health & Wellbeing ......... /health
  2. Families & Children ........ /families
  3. Your Neighborhood .......... /neighborhood
  4. Civic Voice ................ /voice
  5. Money & Work ............... /money
  6. Planet & Environment ....... /planet
  7. The Bigger We .............. /the-bigger-we

Each chapter contains:
  · Start Here (curated picks)
  · Organizations (the spine)
  · Services (what's available)
  · Who Represents You (officials)
  · Policy Tracker
  · Opportunities (get involved)
  · From the Guide (articles, reports, videos)

DIRECTORIES
  Organization Index ............ /orgs (A-Z, searchable)
  Service Finder ................ /services (filterable)
  Official Lookup ............... /officials
  Map ........................... /map (all resources on map)

APPENDICES
  Neighborhood Guides ........... /neighborhoods
  Civic Calendar ................ /calendar
  My Plan ....................... /my-plan (saved resources)
  What's New .................... /news
  Search ........................ /search
  About ......................... /about
```

---

## MOBILE EXPERIENCE

Mobile is the primary platform for this audience. Every pattern above
must work on a 375px screen.

**Key mobile patterns:**
- Bottom tab bar (Home / Pathways / Find / Map / Plan)
- Cards stack vertically, full-width
- Map goes full-screen with bottom sheet for list
- Wizard steps are one-per-screen
- Org action bar (Newsletter/Volunteer/Donate) is sticky at bottom
- ZIP input is in the header, always accessible
- "Call" buttons are prominent (tap-to-call)

---

## IMPLEMENTATION PRIORITY

### Phase 1 — Foundation (the guide works)
1. Pathway chapter pages (`/[pathway-slug]`) with all entity types
2. Org profiles with Newsletter/Volunteer/Donate buttons
3. Standardized resource cards with content type badges
4. ZIP-anchored geography filtering (already built in entity-graph.ts)
5. Simplified navigation

### Phase 2 — Discovery (people find what they need)
6. Resource Finder Wizard (`/start`)
7. "Start Here" curated lists per pathway
8. Dual browse map + list (`/map`)
9. Search improvements

### Phase 3 — Engagement (people take action)
10. My Plan (save, note, share)
11. Civic Calendar with deadlines
12. Ingest pipeline: extract newsletter/donate/volunteer URLs
13. PDF/resource direct linking

### Phase 4 — Community (the guide improves)
14. "Been here" confirmations
15. Community tips/notes
16. Status updates (waitlists, hours changes)
17. Org self-service updates
