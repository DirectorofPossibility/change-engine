# Change Engine — Complete Build Guide
## From zero to live at exchange.thechangelab.net

---

## WHAT YOU NEED BEFORE YOU START

**Accounts (all free to start):**
- GitHub account — github.com
- Supabase account — supabase.com
- Vercel account — vercel.com (sign in with GitHub)
- GoDaddy access — you already have this for thechangelab.net

**Files you should already have downloaded:**
- `change-engine-page-system.html` — the design reference
- `change-engine-claude-code-prompt.md` — the build brief
- `geo-components.tsx` — the sacred geometry SVG library

**On your build machine:**
- Node.js 18 or higher — check with `node --version` in terminal
- If not installed: nodejs.org → download LTS

---

## PART 1 — INSTALL CLAUDE CODE

Open Terminal and run these three commands, one at a time:

```bash
npm install -g @anthropic/claude-code
```

```bash
claude --version
```

If a version number shows, you're set. Then authenticate:

```bash
claude
```

It will open a browser window and ask you to log in with your Anthropic account. Do that. Come back to the terminal. You'll see a `>` prompt. Type `/exit` to leave for now. You're authenticated.

---

## PART 2 — CREATE THE PROJECT

In terminal, navigate to where you keep projects:

```bash
cd ~/Documents
mkdir change-engine
cd change-engine
```

Now start Claude Code inside that folder:

```bash
claude
```

You're now inside a Claude Code session. The `>` prompt means it's listening.

Paste this exactly:

```
Create a new Next.js 14 project with TypeScript, Tailwind CSS, and App Router. 
Project name: change-engine. No src directory. No default example files. 
Install dependencies and confirm everything runs with `npm run dev`.
```

Wait. It will scaffold the full project, install packages, and confirm it runs. This takes 2–3 minutes. Don't interrupt it.

When it's done you'll see something like:
```
✓ Project created. Running on http://localhost:3000
```

Type `/exit` to leave the Claude Code session for now.

---

## PART 3 — SET UP YOUR FILE STRUCTURE

You now have a `change-engine` folder. Before going back into Claude Code, add your reference files. In Finder, open the `change-engine` folder and drop these three files directly into the root (same level as `package.json`):

```
change-engine/
  change-engine-page-system.html       ← drop here
  change-engine-claude-code-prompt.md  ← drop here
  geo-components.tsx                   ← drop here
  package.json
  tailwind.config.ts
  app/
  ...
```

Then create the folder structure for the geo components:

```bash
mkdir -p components/geo
```

Copy the geo file into place:

```bash
cp geo-components.tsx components/geo/index.tsx
```

Confirm it's there:

```bash
ls components/geo/
```

You should see `index.tsx`.

---

## PART 4 — SET UP SUPABASE

Do this before writing any code. Claude Code needs real database credentials.

**4.1 — Create the project**

Go to supabase.com → New project.
- Name: `change-engine`
- Database password: create a strong one, save it somewhere
- Region: US East (closest to Houston)

Wait for it to provision. Takes about 2 minutes.

**4.2 — Get your credentials**

In Supabase dashboard → Settings → API. Copy these three values:

```
Project URL:    https://xxxxxxxxxxxx.supabase.co
Anon key:       eyJh...
Service key:    eyJh...  (keep this secret, never in client code)
```

**4.3 — Create a .env.local file**

In your `change-engine` folder, create a file called `.env.local`:

```bash
touch .env.local
```

Open it and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...your anon key...
SUPABASE_SERVICE_ROLE_KEY=eyJh...your service key...
```

**4.4 — Run the schema**

In Supabase dashboard → SQL Editor → New query. Paste and run this:

```sql
-- THEMES
create table themes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  region_num int,
  color text,
  color_lt text,
  color_dk text,
  geo_type text,
  hed_em text,
  deck text,
  feature_lede text,
  pull_quotes jsonb default '[]',
  data_stories jsonb default '[]',
  stats jsonb default '[]',
  created_at timestamptz default now()
);

-- FOCUS AREAS
create table focus_areas (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid references themes on delete cascade,
  slug text unique not null,
  name text not null,
  brief text,
  geo_type text,
  trail_levels_loaded int default 0,
  max_trail_level int default 5,
  has_active_civic boolean default false,
  position int default 0,
  created_at timestamptz default now()
);

-- RESOURCES
create table resources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content_type text,
  trail_level int,
  source_name text,
  duration text,
  cost text,
  location text,
  hours text,
  contact text,
  url text,
  is_active boolean default false,
  active_label text,
  active_deadline date,
  geo_type text,
  body_hed text,
  body_copy text,
  services jsonb default '[]',
  quick_facts jsonb default '[]',
  next_steps jsonb default '[]',
  created_at timestamptz default now()
);

-- JUNCTION: focus areas ↔ resources
create table focus_area_resources (
  focus_area_id uuid references focus_areas on delete cascade,
  resource_id uuid references resources on delete cascade,
  is_primary boolean default false,
  primary key (focus_area_id, resource_id)
);

-- COUCH CONTENT
create table couch_content (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid references themes on delete cascade,
  focus_area_id uuid references focus_areas on delete set null,
  slug text,
  content_type text,
  title text not null,
  dek text,
  source text,
  duration text,
  url text,
  is_feature boolean default false,
  position int default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security (read-only public access)
alter table themes          enable row level security;
alter table focus_areas     enable row level security;
alter table resources       enable row level security;
alter table focus_area_resources enable row level security;
alter table couch_content   enable row level security;

-- Public read policies
create policy "Public read themes"          on themes          for select using (true);
create policy "Public read focus_areas"     on focus_areas     for select using (true);
create policy "Public read resources"       on resources       for select using (true);
create policy "Public read far"             on focus_area_resources for select using (true);
create policy "Public read couch_content"   on couch_content   for select using (true);
```

Click Run. All tables should create without errors.

**4.5 — Seed the Health region**

Still in SQL Editor. Run this to populate your first region:

```sql
-- Insert Health theme
insert into themes (slug, name, region_num, color, color_lt, color_dk, geo_type,
  hed_em, deck, feature_lede, pull_quotes, data_stories, stats)
values (
  'health', 'Health', 1,
  '#1a6b56', '#e4f2ed', '#0a2a22',
  'vesica_piscis',
  'in Houston',
  'Twenty-four destinations. One region. What it means to be well in this city — from your zip code''s clinics to the policies setting the terms.',
  'Houston has world-class medical institutions and some of the worst health outcomes of any major American city. Both things are true. The Texas Medical Center — the largest in the world — sits inside a city where nearly a million residents have no health insurance, where the maternal mortality rate for Black women is three times the rate for white women, and where zip code remains the strongest predictor of how long you''ll live.',
  '[
    {"quote": "That''s not a motivation problem. It''s a navigation problem. The resources exist. Most people just can''t find them.", "source": "The Change Lab"},
    {"quote": "Your body exists in a neighborhood. Your neighborhood determines your options.", "source": "Houston Health Atlas, 2024"}
  ]',
  '[
    {"num": "970K", "hed": "Uninsured residents in Harris County", "copy": "The highest uninsured rate of any major metro county. Most are working adults in industries without employer coverage."},
    {"num": "1 in 4", "hed": "Houston children experience food insecurity", "copy": "Houston has more food banks per capita than most cities its size — and still ranks near the bottom for food security outcomes."},
    {"num": "3×", "hed": "Gap in maternal mortality by race", "copy": "Black mothers in Harris County die at more than three times the rate of white mothers. Doula access, insurance coverage, and hospital proximity are all factors with active advocacy campaigns."}
  ]',
  '[
    {"num": "24", "desc": "Destinations"},
    {"num": "1 in 3", "desc": "Harris Co. adults report poor mental health"},
    {"num": "4th", "desc": "Largest city, ranked last in food security among major metros"}
  ]'
);

-- Insert focus areas for Health
insert into focus_areas (theme_id, slug, name, brief, geo_type, trail_levels_loaded, has_active_civic, position)
select t.id, fa.slug, fa.name, fa.brief, fa.geo_type, fa.levels, fa.civic, fa.pos
from themes t, (values
  ('mental-health',           'Mental Health',             'Therapy access, crisis support, community wellness, and the stigma we can all help reduce.',                           'vesica_piscis',    2, false, 1),
  ('food-access',             'Food Access',               'Food banks, community gardens, nutrition programs, and the right to eat well in your zip code.',                        'flower_of_life',   3, false, 2),
  ('healthcare-access',       'Healthcare Access',         'Finding a doctor, navigating insurance, community health clinics, and knowing your options.',                           'compass_rose',     3, false, 3),
  ('maternal-health',         'Maternal Health',           'Prenatal care, postpartum support, doulas, and closing birth outcome gaps.',                                            'nested_circles',   1, true,  4),
  ('substance-use-recovery',  'Substance Use & Recovery',  'Treatment resources, harm reduction, recovery communities, and paths forward.',                                         'outward_spiral',   3, false, 5),
  ('disability-access',       'Disability & Access',       'Accessibility, disability rights, adaptive services, and full participation in community life.',                        'hub_and_spokes',   4, false, 6),
  ('oral-health',             'Oral Health',               'Dental care access, free and low-cost clinics, and children''s oral health.',                                           'six_petal_rose',   3, false, 7),
  ('environmental-health',    'Environmental Health',      'Air quality, toxic exposure, industrial neighbors, and your right to a healthy environment.',                           'torus',            3, true,  8)
) as fa(slug, name, brief, geo_type, levels, civic, pos)
where t.slug = 'health';
```

You now have a live database with real data.

---

## PART 5 — THE CLAUDE CODE BUILD SEQUENCE

Go back to your terminal. Navigate into the project:

```bash
cd ~/Documents/change-engine
claude
```

You're back in Claude Code. Now follow these steps in order. **Complete each step before moving to the next. Do not skip ahead.**

---

### STEP 1 — Design tokens

```
Read change-engine-claude-code-prompt.md fully before doing anything.
Then read change-engine-page-system.html.
Confirm you have understood both files, then begin Step 1 from the build order:
create tailwind.config.ts with all design tokens exactly as specified in the prompt.
```

Wait for it to finish. Then verify:

```
Show me the complete tailwind.config.ts you just created.
```

Check that Fraunces, Libre Baskerville, and DM Mono are in the font config. Check that all color tokens are present.

---

### STEP 2 — Geo components

```
The geo components are already written. 
The file components/geo/index.tsx already exists in the project.
Do not rewrite it. Confirm you can read it and understand the GeoProps interface 
and the GEO_MAP lookup. Then tell me what you see.
```

It should describe all 13 components. If it says the file doesn't exist, run:

```bash
ls components/geo/
```

If it's missing, re-run the copy command from Part 3.

---

### STEP 3 — Navigation and Wayfinder

```
Build two layout components exactly as specified in change-engine-claude-code-prompt.md:
1. components/layout/SiteNav.tsx
2. components/layout/Wayfinder.tsx

Match the visual spec in the prompt exactly. 
Use the SeedOfLife geo component in the nav brand mark.
No border-radius anywhere. DM Mono for all labels and links.
```

---

### STEP 4 — Install Supabase client

```
Install the Supabase client library and create the database utility files:
npm install @supabase/supabase-js

Then create:
- lib/supabase/client.ts   (browser client using NEXT_PUBLIC_ env vars)
- lib/supabase/server.ts   (server client for data fetching in Server Components)
```

---

### STEP 5 — Theme Hub page

```
Build app/[region]/page.tsx — the Theme Hub page template.
Use the design spec in change-engine-claude-code-prompt.md under PAGE TYPE 1.
Use the visual layout in change-engine-page-system.html — the first tab 
"Theme Hub: Health" is the exact reference.

Build all required sub-components:
- components/theme/ThemeMasthead.tsx
- components/theme/FeatureOpener.tsx
- components/theme/DataStories.tsx
- components/theme/CouchGrid.tsx
- components/theme/ControlPanel.tsx
- components/theme/Instrument.tsx

The Instrument component must include the status arc SVG with the 
stroke-dashoffset calculation for content depth.
No border-radius. No emojis. No Inter font.
```

When it's done:

```
Run the dev server and confirm /health loads without errors.
```

---

### STEP 6 — Focus Area Hub page

```
Build app/[region]/[destination]/page.tsx — the Focus Area Hub page template.
Use the design spec under PAGE TYPE 2.
Use the "Focus Area: Mental Health" tab in change-engine-page-system.html as reference.

Build:
- components/focus/FocusMasthead.tsx
- components/focus/TrailLevel.tsx
- components/focus/TrailEntry.tsx

Level 5 entries with is_active=true get a 3px solid civic red left border.
Travel guide level names: Before You Go, Packing List, Day Trips, Local Guides, The Deep Journey.
```

When done:

```
Confirm /health/mental-health loads without errors.
```

---

### STEP 7 — Resource page

```
Build app/[region]/[destination]/[resource]/page.tsx — the Resource page template.
Use PAGE TYPE 3 spec and the "Resource: The Harris Center" tab as reference.

Build:
- components/resource/ResourceMasthead.tsx
- components/resource/ResourceBody.tsx
- components/resource/ResourceSidebar.tsx
- components/resource/TrailPosition.tsx
- components/resource/RelatedResources.tsx

The dog-ear corner on related resource cards must use the CSS ::after 
pseudo-element border trick (zero border-radius, never a box-shadow).
Body copy is editorial prose only — no bullet lists.
```

---

### STEP 8 — Wire up navigation

```
Update app/layout.tsx to include SiteNav and make it sticky below any 
future announcement bars.

Add a home page at app/page.tsx that shows all themes as a grid, 
each linking to /[region]. Use the same Instrument component style 
but sized larger — this is the guide's table of contents page.
```

---

### STEP 9 — Seed a second focus area resource

```
Add 3 resources to the database for Mental Health, connected via 
focus_area_resources. Include:
1. The Harris Center — content_type: organization, trail_level: 4
2. Crisis Text Line — content_type: service, trail_level: 4  
3. How to find a Medicaid therapist in Texas — content_type: guide, trail_level: 2

Use the data from the mockup file as the content. Then confirm 
/health/mental-health/harris-center loads and shows real data.
```

---

### STEP 10 — Typography and final design check

```
Do a full design audit of all three page types against 
change-engine-page-system.html and change-engine-claude-code-prompt.md.

Check for:
- Any border-radius (should be zero everywhere except dots/circles)
- Any font that is not Fraunces, Libre Baskerville, or DM Mono
- Any emoji or unicode icon
- Any bullet point list in body copy (should be prose)
- Any blue or purple gradient on white background
- All DM Mono labels are uppercase with letter-spacing

Fix anything that drifted from spec.
```

---

## PART 6 — DEPLOY TO VERCEL

**6.1 — Push to GitHub**

In terminal (not Claude Code — type /exit first):

```bash
cd ~/Documents/change-engine
git init
git add .
git commit -m "Initial build — Change Engine"
```

Go to github.com → New repository → name it `change-engine` → Create.

Then push:

```bash
git remote add origin https://github.com/YOURUSERNAME/change-engine.git
git branch -M main
git push -u origin main
```

**6.2 — Connect to Vercel**

Go to vercel.com → Add New Project → Import from GitHub → select `change-engine`.

Before deploying, add your environment variables. In Vercel's project settings → Environment Variables, add all three from your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Click Deploy. First deploy takes about 3 minutes.

When it's done, Vercel gives you a URL like `change-engine-abc123.vercel.app`. Open it. Everything should work.

---

## PART 7 — CONNECT YOUR DOMAIN

You want `exchange.thechangelab.net` pointing to this Vercel deployment.

**7.1 — Add domain in Vercel**

In your Vercel project → Settings → Domains → Add Domain.

Type: `exchange.thechangelab.net`

Vercel will show you a DNS record to add. It will be a CNAME record that looks like:

```
Type:   CNAME
Name:   exchange
Value:  cname.vercel-dns.com
```

**7.2 — Add the record in GoDaddy**

Go to GoDaddy → My Products → thechangelab.net → DNS → Add New Record.

- Type: CNAME
- Host: `exchange`
- Points to: `cname.vercel-dns.com`
- TTL: 1 hour

Save it.

**7.3 — Wait and verify**

DNS propagates in 10–30 minutes. Check it with:

```bash
dig exchange.thechangelab.net
```

When it shows Vercel's IP, your domain is live. Vercel automatically provisions an SSL certificate — you get HTTPS for free, no setup required.

---

## PART 8 — ONGOING WORKFLOW

Once the site is live, your day-to-day loop is:

**Adding content:** Go directly to Supabase dashboard → Table Editor. Add rows to `themes`, `focus_areas`, `resources`, `couch_content`. The site reads from the database on every request — no rebuild needed.

**Design changes:** Make changes locally, test with `npm run dev`, push to GitHub. Vercel auto-deploys every time you push to `main`. Usually live within 90 seconds.

**Adding a new region:** Insert a row in `themes`, insert rows in `focus_areas` with the matching `theme_id`. The dynamic routes (`[region]`, `[destination]`, `[resource]`) handle everything automatically.

**When Claude Code drifts from the design:**

```
Re-read the design constraints section of change-engine-claude-code-prompt.md 
and fix what just drifted. Match change-engine-page-system.html exactly.
```

---

## TROUBLESHOOTING

**"Module not found" errors after Claude Code builds something:**
```bash
npm install
```
Then re-run `npm run dev`.

**Supabase returning empty data:**
Check that Row Level Security policies were created. In Supabase → Authentication → Policies — you should see read policies on all five tables.

**Vercel build failing:**
Check the build logs in Vercel dashboard. Most common cause: missing environment variable. Make sure all three are set in Vercel → Settings → Environment Variables.

**Font not loading:**
Claude Code sometimes forgets to add `next/font` setup in `app/layout.tsx`. Check that Fraunces, Libre Baskerville, and DM Mono are imported from `next/font/google` and applied as CSS variables.

**Domain not resolving after 2 hours:**
In GoDaddy, double-check the CNAME Host is `exchange` (not `exchange.thechangelab.net`). GoDaddy appends the root domain automatically — if you type the full subdomain it creates `exchange.thechangelab.net.thechangelab.net`.

---

## FILES SUMMARY

| File | Where it lives | What it does |
|---|---|---|
| `change-engine-page-system.html` | project root | Visual reference — Claude Code reads this |
| `change-engine-claude-code-prompt.md` | project root | Full build spec — Claude Code reads this |
| `geo-components.tsx` | project root initially | Copy to `components/geo/index.tsx` |
| `.env.local` | project root | Your Supabase keys — never commit to GitHub |

---

The Change Lab · Houston, TX  
exchange.thechangelab.net
