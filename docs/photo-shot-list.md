# Photo & Image Shot List

Drop each file into `public/images/guide/` at the exact path shown.
Push to master = live on Vercel.

Directory: `public/images/guide/`
URL in code: `/images/guide/[path]`

---

## PHOTOS TO SHOOT / SOURCE (webp format)

### Homepage

| # | Filename | Size | What to shoot |
|---|----------|------|---------------|
| 1 | `home/hero-bg.webp` | 1920x800 | Aerial of Buffalo Bayou curving through downtown at golden hour. Shoot from Eleanor Tinsley Park or drone. Slightly desaturated — white text will sit on top. |
| 2 | `home/hero-bg-mobile.webp` | 768x600 | Same scene, cropped portrait. Focus on the bayou bend + skyline slice. |
| 3 | `home/neighborhood-illustration.webp` | 800x500 | Illustrated map of Houston (commission from artist or generate). Travel-guide fold-out style. Landmarks sketched in: Astrodome, Medical Center, Buffalo Bayou, Ship Channel, TSU, UH. Warm earth tones. |

### Pathway Headers

| # | Filename | Size | What to shoot |
|---|----------|------|---------------|
| 4 | `pathways/health-header.webp` | 1400x400 | Texas Medical Center — aerial or street level. OR: community health fair under live oaks. OR: mobile clinic van parked in Third Ward. Green cast. |
| 5 | `pathways/families-header.webp` | 1400x400 | Families at Discovery Green or Hermann Park. Multi-generational, multi-ethnic. Kids on playground, abuelas watching, picnic blankets. Warm afternoon light. |
| 6 | `pathways/neighborhood-header.webp` | 1400x400 | Houston residential block — shotgun houses next to new townhomes, live oak canopy overhead, maybe a taco truck. Third Ward, Heights, or East End. Purple cast. |
| 7 | `pathways/voice-header.webp` | 1400x400 | City Hall steps with citizens, OR a packed council chamber / town hall with diverse attendees raising hands. Red cast. |
| 8 | `pathways/money-header.webp` | 1400x400 | Small businesses on Hillcroft (Mahatma Gandhi District), OR a maker space, OR the Port of Houston cranes. Entrepreneurship and hustle. Gold cast. |
| 9 | `pathways/planet-header.webp` | 1400x400 | Buffalo Bayou Park trail, OR community garden with raised beds, OR Houston Arboretum. Nature inside the city. Could include a bayou cleanup crew. Green cast. |
| 10 | `pathways/bigger-we-header.webp` | 1400x400 | Houston's diversity — Lunar New Year on Bellaire, Diwali on Hillcroft, Juneteenth at Emancipation Park, OR a multi-cultural block party. Blue cast. |

### Engagement

| # | Filename | Size | What to shoot |
|---|----------|------|---------------|
| 11 | `engagement/wizard-hero.webp` | 800x500 | Illustrated (commission): person standing at trail fork with 7 colored paths leading into Houston neighborhoods. Field guide aesthetic. |
| 12 | `engagement/volunteer.webp` | 600x400 | Volunteers at Houston Food Bank sorting boxes, OR Harvey-style neighbors helping neighbors. Real sweat, real smiles, diverse group. |

### County Photos

| # | Filename | Size | What to shoot |
|---|----------|------|---------------|
| 13 | `counties/harris.webp` | 800x400 | Downtown Houston from Buffalo Bayou Park. Skyline reflecting in water, bayou greenway in foreground. |
| 14 | `counties/fort-bend.webp` | 800x400 | Sugar Land Town Square or Missouri City main street. Diverse suburb, walkable, mature trees. |
| 15 | `counties/montgomery.webp` | 800x400 | The Woodlands — forested bike path through pine canopy, OR Lake Conroe shoreline. Feels different from Houston. |
| 16 | `counties/galveston.webp` | 800x400 | The Strand District Victorian buildings with ornate ironwork, OR the Seawall at golden hour. Coastal light. |
| 17 | `counties/brazoria.webp` | 800x400 | Pearland area — newer development meeting coastal prairie, OR Brazos River bend. Southern growth corridor. |
| 18 | `counties/liberty.webp` | 800x400 | Trinity River or rural East Texas. Open prairie, timber, wide sky. The quiet edge. |
| 19 | `counties/waller.webp` | 800x400 | Prairie View A&M campus, OR rolling prairie farmland. Western rural edge with HBCU heritage. |
| 20 | `counties/chambers.webp` | 800x400 | Anahuac wildlife refuge — coastal marsh, egrets, shrimp boats. Where the metro meets the Gulf. |

---

## SVGs TO CREATE / COMMISSION (svg format)

### Trail Level Icons (set of 5, consistent style)

Style: Simple single-color line art. Like trail markers in a field guide.
All same weight, same style, same 64x64 artboard. Color: #1b5e8a (bayou blue).

| # | Filename | Size | What to draw |
|---|----------|------|--------------|
| 21 | `trails/01-get-curious.svg` | 64x64 | Eye or binoculars — watching, learning |
| 22 | `trails/02-find-your-people.svg` | 64x64 | Two figures or handshake — connecting |
| 23 | `trails/03-show-up.svg` | 64x64 | Footprint or open door — participating |
| 24 | `trails/04-go-deeper.svg` | 64x64 | Roots or growing tree — building skills |
| 25 | `trails/05-make-your-move.svg` | 64x64 | Compass rose or planted flag — leading |

### Houston Identity Elements

| # | Filename | Size | What to draw |
|---|----------|------|--------------|
| 26 | `houston/bayou-divider.svg` | 600x20 | Horizontal line that curves like Buffalo Bayou with tiny live oak silhouettes on banks. Single color #1b5e8a. Used as section break between page sections. Thin and elegant. |
| 27 | `houston/live-oak.svg` | 500x400 | Spreading live oak tree silhouette with Spanish moss hanging from branches. Single color. Used at 5-10% opacity as page watermark. |
| 28 | `houston/skyline.svg` | 1200x120 | Houston skyline silhouette — Williams Tower, downtown cluster, scattered highrises (the no-zoning look). Single color. Footer decoration. |
| 29 | `houston/county-map.svg` | 600x500 | 8-county outline map. IMPORTANT: each county must be a separate `<path>` element with an id (`harris`, `fort-bend`, `montgomery`, `galveston`, `brazoria`, `liberty`, `waller`, `chambers`) so code can color them individually. No labels, no fill — just outlines. |
| 30 | `houston/neighborhood-pattern.svg` | 200x200 | Repeating tile pattern — Heights Victorian gingerbread trim or shotgun house rooflines. Very subtle, for 3-5% opacity backgrounds. Must tile seamlessly in both directions. |

### Ward Markers (set of 6, consistent style)

Style: Same as trail icons — single-color line art, 48x48 artboard. Color: #1b5e8a.

| # | Filename | Size | What to draw |
|---|----------|------|--------------|
| 31 | `houston/wards/first-ward.svg` | 48x48 | Arts/gallery district — paintbrush, easel, or gallery window |
| 32 | `houston/wards/second-ward.svg` | 48x48 | East End / Latino culture — mural brushstroke or Guadalupe-inspired motif |
| 33 | `houston/wards/third-ward.svg` | 48x48 | Black community / education — shotgun house profile or university tower |
| 34 | `houston/wards/fourth-ward.svg` | 48x48 | Freedmen's Town — Emancipation Park arch or freedom torch |
| 35 | `houston/wards/fifth-ward.svg` | 48x48 | Industry / resilience — railroad crossing or anvil |
| 36 | `houston/wards/sixth-ward.svg` | 48x48 | Preservation — Victorian cottage silhouette or gingerbread trim detail |

### Engagement Illustrations

| # | Filename | Size | What to draw |
|---|----------|------|--------------|
| 37 | `engagement/empty-nearby.svg` | 400x250 | Houston skyline outline with a map pin and a dotted circle expanding outward. "Widening search." Encouraging feel. Color: #1b5e8a. |
| 38 | `engagement/empty-plan.svg` | 400x300 | Open book with blank pages, a pen resting on it, and 3-4 pathway-colored bookmarks (use actual pathway hex colors) sticking out from pages. "Your journey starts here." |
| 39 | `engagement/donate.svg` | 200x200 | Hand holding a seed or small plant. Generosity as growth. Color: #C4663A (clay). |
| 40 | `engagement/newsletter.svg` | 200x200 | Envelope with a small wave or sprout coming out. Information flowing. Color: #1b5e8a. |

### Content Type Badge Icons (set of 10, consistent style)

Style: Minimal single-color line art. 24x24 artboard. 2px stroke. Color: currentColor (so they inherit from CSS).

| # | Filename | Size | What to draw |
|---|----------|------|--------------|
| 41 | `content-types/article.svg` | 24x24 | Document with horizontal text lines |
| 42 | `content-types/report.svg` | 24x24 | Document with a small bar chart in it |
| 43 | `content-types/video.svg` | 24x24 | Play triangle in a rounded rectangle |
| 44 | `content-types/event.svg` | 24x24 | Calendar page with a dot/pin on a date |
| 45 | `content-types/guide.svg` | 24x24 | Compass or numbered steps (1-2-3) |
| 46 | `content-types/tool.svg` | 24x24 | Wrench or calculator |
| 47 | `content-types/course.svg` | 24x24 | Graduation cap or stacked books |
| 48 | `content-types/campaign.svg` | 24x24 | Megaphone |
| 49 | `content-types/dataset.svg` | 24x24 | Bar chart or spreadsheet grid |
| 50 | `content-types/opportunity.svg` | 24x24 | Raised hand |

### Org Action CTA Icons (set of 5)

Style: Line art, 32x32 artboard, 2px stroke. Each has its own color baked in.

| # | Filename | Size | What to draw |
|---|----------|------|--------------|
| 51 | `org-actions/newsletter.svg` | 32x32 | Envelope with small "+" badge. Color: #1b5e8a |
| 52 | `org-actions/volunteer.svg` | 32x32 | Two raised hands or handshake. Color: #1a6b56 |
| 53 | `org-actions/donate.svg` | 32x32 | Heart in an open palm. Color: #C4663A |
| 54 | `org-actions/events.svg` | 32x32 | Calendar with a star on it. Color: #7a2018 |
| 55 | `org-actions/careers.svg` | 32x32 | Briefcase or open door. Color: #6a4e10 |

---

## Summary

| Category | Photos (webp) | SVGs | Total |
|----------|--------------|------|-------|
| Homepage | 2 + 1 illustrated | — | 3 |
| Pathway headers | 7 | — | 7 |
| Engagement | 2 | 4 | 6 |
| County photos | 8 | — | 8 |
| Trail icons | — | 5 | 5 |
| Houston identity | — | 11 | 11 |
| Content type badges | — | 10 | 10 |
| Org action icons | — | 5 | 5 |
| **Total** | **20** | **35** | **55** |

### Quick Start (minimum viable)
If you want to get the redesign live fast, prioritize these 10:
1. `home/hero-bg.webp` — homepage hero
2. `pathways/health-header.webp` — one pathway to prove the pattern
3. `trails/01-get-curious.svg` through `trails/05-make-your-move.svg` — the 5 journey icons
4. `houston/bayou-divider.svg` — section divider used everywhere
5. `houston/skyline.svg` — footer
6. `org-actions/newsletter.svg` + `volunteer.svg` + `donate.svg` — org page CTAs
