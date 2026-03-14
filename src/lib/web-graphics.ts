/**
 * Web Graphics — Image placeholder system for the field guide redesign.
 *
 * All images served from /public/images/guide/ — deployed with the site
 * on Vercel. Drop the file at the correct path, push, it's live.
 *
 * Directory: public/images/guide/
 * URL pattern: /images/guide/[path]
 */

const BASE_PATH = '/images/guide'

// ── Types ──────────────────────────────────────────────────────────────

export interface WebGraphic {
  /** Path within the web-graphics bucket */
  path: string
  /** Full public URL */
  url: string
  /** What the image should depict — brief for upload reference */
  description: string
  /** Recommended dimensions (width x height in pixels) */
  dimensions: string
  /** Format recommendation */
  format: 'webp' | 'svg' | 'png' | 'jpg'
  /** Where this image appears in the UI */
  usage: string
}

function graphic(
  path: string,
  description: string,
  dimensions: string,
  format: 'webp' | 'svg' | 'png' | 'jpg',
  usage: string,
): WebGraphic {
  return { path, url: `${BASE_PATH}/${path}`, description, dimensions, format, usage }
}

// ── HOMEPAGE ───────────────────────────────────────────────────────────

export const HOME_GRAPHICS = {
  /**
   * HERO BACKGROUND
   * Aerial or wide-angle of Houston — Buffalo Bayou winding through downtown,
   * or the skyline at golden hour from Eleanor Tinsley Park.
   * Muted/desaturated so text reads clearly over it.
   * Should feel warm, expansive, inviting — NOT a stock photo.
   */
  heroBg: graphic(
    'home/hero-bg.webp',
    'Aerial view of Buffalo Bayou winding through downtown Houston at golden hour. Warm tones, slightly desaturated for text overlay. Shows the bayou as connector, green space meeting urban landscape.',
    '1920x800',
    'webp',
    'Homepage hero background (full-width, behind text)',
  ),

  /**
   * HERO MOBILE
   * Same scene cropped tighter for mobile, portrait-oriented.
   */
  heroBgMobile: graphic(
    'home/hero-bg-mobile.webp',
    'Same Buffalo Bayou/downtown scene cropped for mobile portrait. Focus on the bayou curve and a slice of skyline.',
    '768x600',
    'webp',
    'Homepage hero background (mobile)',
  ),

  /**
   * NEIGHBORHOOD SECTION — Mini Map Illustration
   * Stylized illustrated map of Houston super neighborhoods.
   * Not a literal map — more like an illustrated travel guide map
   * with landmarks sketched in (Astrodome, TSU, Medical Center, ship channel).
   */
  neighborhoodMap: graphic(
    'home/neighborhood-illustration.webp',
    'Illustrated/stylized map of Houston neighborhoods in the style of a travel guide fold-out map. Key landmarks sketched: Astrodome silhouette, Medical Center cluster, Buffalo Bayou path, Ship Channel, TSU, UH. Warm earth tones with pathway colors as accents.',
    '800x500',
    'webp',
    'Homepage "Your Neighborhood" section illustration',
  ),
}

// ── PATHWAY CHAPTER HEADERS ────────────────────────────────────────────
// Each pathway chapter gets a header image that evokes the topic
// through Houston-specific imagery. NOT generic stock photos.

export const PATHWAY_GRAPHICS = {
  health: graphic(
    'pathways/health-header.webp',
    'Texas Medical Center aerial or street-level — the largest medical complex in the world, right here in Houston. Show the scale and the humanity: maybe a community health fair under live oaks, or a mobile clinic van in Third Ward. Bayou Green tones.',
    '1400x400',
    'webp',
    'Health pathway chapter header',
  ),

  families: graphic(
    'pathways/families-header.webp',
    'Houston families at Discovery Green or Hermann Park — multi-generational, reflecting Houston\'s diversity. Kids on playground, abuelas on benches, families picnicking. Natural light, warm afternoon feel. Deep Blue tones.',
    '1400x400',
    'webp',
    'Families pathway chapter header',
  ),

  neighborhood: graphic(
    'pathways/neighborhood-header.webp',
    'A Houston residential street showing the "no-zoning" character — shotgun houses next to new townhomes, mature live oaks creating a canopy, maybe a taco truck on the corner. Third Ward, Heights, or East End character. Ward Purple tones.',
    '1400x400',
    'webp',
    'Neighborhood pathway chapter header',
  ),

  voice: graphic(
    'pathways/voice-header.webp',
    'Houston City Hall with citizens on the steps, OR a packed town hall meeting / city council chamber with diverse attendees. The feeling of civic participation — real people engaging with their government. Voice Red tones.',
    '1400x400',
    'webp',
    'Voice pathway chapter header',
  ),

  money: graphic(
    'pathways/money-header.webp',
    'Houston\'s economic engine — could be the Energy Corridor, a small business on Hillcroft (the Mahatma Gandhi District), a maker space, or the Port of Houston. Show entrepreneurship and economic activity, not Wall Street. Money Gold tones.',
    '1400x400',
    'webp',
    'Money pathway chapter header',
  ),

  planet: graphic(
    'pathways/planet-header.webp',
    'Buffalo Bayou Park greenway, a community garden in EaDo, or the Houston Arboretum. Show nature WITHIN the city — urban ecology, not wilderness. Could include a bayou cleanup crew or community tree planting. Planet Green tones.',
    '1400x400',
    'webp',
    'Planet pathway chapter header',
  ),

  'the-bigger-we': graphic(
    'pathways/bigger-we-header.webp',
    'The diversity of Houston — Lunar New Year in Chinatown, Diwali on Hillcroft, Juneteenth in Emancipation Park, or a multi-cultural community gathering. The "most diverse city in America" visual. Show connection across difference. Bigger Blue tones.',
    '1400x400',
    'webp',
    'The Bigger We pathway chapter header',
  ),
}

// ── TRAIL LEVEL ICONS ──────────────────────────────────────────────────
// The 5-step engagement journey. Each level gets an icon/illustration
// that communicates the depth of involvement. Should feel like
// trail markers or field guide section dividers.

export const TRAIL_GRAPHICS = {
  level1_getCurious: graphic(
    'trails/01-get-curious.svg',
    'Trail marker icon: an eye or binoculars — the "observer" stage. Looking, reading, learning. Simple line art, single color. Like a field guide\'s "identification" section icon.',
    '64x64',
    'svg',
    'Trail Level 1 icon — Get Curious (learn, read, watch)',
  ),

  level2_findYourPeople: graphic(
    'trails/02-find-your-people.svg',
    'Trail marker icon: two figures or handshake — the "connector" stage. Finding community, joining a newsletter, discovering orgs. Simple line art.',
    '64x64',
    'svg',
    'Trail Level 2 icon — Find Your People (connect, join, subscribe)',
  ),

  level3_showUp: graphic(
    'trails/03-show-up.svg',
    'Trail marker icon: a footprint or door — the "participant" stage. Showing up in person, attending an event, volunteering once. Simple line art.',
    '64x64',
    'svg',
    'Trail Level 3 icon — Show Up (attend, volunteer, participate)',
  ),

  level4_goDeeper: graphic(
    'trails/04-go-deeper.svg',
    'Trail marker icon: roots or a tree growing — the "builder" stage. Developing skills, taking a course, joining a committee. Shows growth and depth. Simple line art.',
    '64x64',
    'svg',
    'Trail Level 4 icon — Go Deeper (train, commit, build skills)',
  ),

  level5_makeYourMove: graphic(
    'trails/05-make-your-move.svg',
    'Trail marker icon: a compass rose or flag planted — the "leader" stage. Organizing, running for office, starting something new. Shows direction and initiative. Simple line art.',
    '64x64',
    'svg',
    'Trail Level 5 icon — Make Your Move (lead, organize, launch)',
  ),
}

// ── ENGAGEMENT ILLUSTRATIONS ───────────────────────────────────────────
// Larger illustrations for the /start wizard and pathway "get involved" sections.

export const ENGAGEMENT_GRAPHICS = {
  /**
   * RESOURCE FINDER WIZARD — Hero
   * Illustration of a person at a crossroads/trailhead with multiple
   * paths branching out (one per pathway color). Houston skyline in
   * the background. Field guide / trail map aesthetic.
   */
  wizardHero: graphic(
    'engagement/wizard-hero.webp',
    'Illustrated person standing at a trail junction with 7 color-coded paths branching into Houston. Each path leads toward a different part of the city. Field guide / illustrated map style — like the opening page of a Lonely Planet chapter. Warm, inviting, not cartoonish.',
    '800x500',
    'webp',
    '/start wizard hero illustration',
  ),

  /**
   * EMPTY STATE — "No results near you"
   * When geo-filtered results return 0. Shows the Houston skyline
   * with a "wider view" feel — the resources are out there, just
   * a bit further. Encouraging, not discouraging.
   */
  emptyStateNearby: graphic(
    'engagement/empty-nearby.svg',
    'Illustrated Houston skyline with a dotted circle expanding outward from a pin — "expanding your search" visual. Gentle, encouraging. Text overlay area below. Line art with bayou blue accent.',
    '400x250',
    'svg',
    'Empty state when no results in user\'s ZIP (before fallback to metro-wide)',
  ),

  /**
   * MY PLAN — Empty State
   * When the user hasn't saved anything yet. Open field guide
   * with blank pages, inviting them to start exploring.
   */
  emptyPlan: graphic(
    'engagement/empty-plan.svg',
    'Illustrated open book/guide with blank pages and a pen. A few pathway-colored bookmarks sticking out. Inviting — "your civic journey starts here" feeling. Line art style.',
    '400x300',
    'svg',
    '/my-plan empty state — no saved resources yet',
  ),

  /**
   * VOLUNTEER — Category illustration
   * Hands working together — building, planting, serving food.
   * Houston-specific: could reference Harvey volunteer spirit.
   */
  volunteerIllustration: graphic(
    'engagement/volunteer.webp',
    'Diverse group of Houston volunteers — maybe at Houston Food Bank sorting food, or doing Hurricane Harvey-style neighbor-helping-neighbor cleanup. Real human warmth, not corporate volunteering stock. Show effort, sweat, smiles.',
    '600x400',
    'webp',
    'Volunteer category illustration on pathway pages and /start results',
  ),

  /**
   * DONATE — Category illustration
   */
  donateIllustration: graphic(
    'engagement/donate.svg',
    'Simple illustration of a hand and a heart or seed growing — generosity as planting, not transacting. Warm clay/terracotta color. Line art.',
    '200x200',
    'svg',
    'Donate action illustration',
  ),

  /**
   * NEWSLETTER — Category illustration
   */
  newsletterIllustration: graphic(
    'engagement/newsletter.svg',
    'Illustrated envelope with a small sprout or bayou wave coming out of it — information flowing to you. Bayou blue accent. Line art.',
    '200x200',
    'svg',
    'Newsletter signup illustration',
  ),
}

// ── HOUSTON IDENTITY ───────────────────────────────────────────────────
// Reusable Houston-specific imagery used across the site.

export const HOUSTON_GRAPHICS = {
  /**
   * BAYOU DIVIDER
   * A horizontal decorative element — a stylized bayou curve
   * used as a section divider throughout the guide.
   * Like a chapter break ornament in a book.
   */
  bayouDivider: graphic(
    'houston/bayou-divider.svg',
    'Horizontal decorative divider — a stylized Buffalo Bayou curve with subtle live oak silhouettes on either bank. Single color (bayou deep blue #1b5e8a). Used like a chapter break ornament between page sections. Thin, elegant, ~20px tall.',
    '600x20',
    'svg',
    'Section divider used between major page sections throughout the guide',
  ),

  /**
   * LIVE OAK SILHOUETTE
   * The iconic Houston live oak with Spanish moss.
   * Used as a background watermark or section accent.
   */
  liveOakSilhouette: graphic(
    'houston/live-oak.svg',
    'Silhouette of a spreading live oak tree with Spanish moss draping from branches. Single color, designed to be used at low opacity (5-10%) as a watermark behind content sections. The tree Houston is known for.',
    '500x400',
    'svg',
    'Background watermark / decorative element on section backgrounds',
  ),

  /**
   * SKYLINE SILHOUETTE
   * Houston skyline from the west (the classic view from I-10).
   * Used in footer or as a subtle background element.
   */
  skylineSilhouette: graphic(
    'houston/skyline.svg',
    'Houston skyline silhouette from the west — Williams Tower, downtown cluster, scattered high-rises (no-zoning skyline). Single color line. Not too detailed — recognizable at small sizes.',
    '1200x120',
    'svg',
    'Footer decoration or background element',
  ),

  /**
   * COUNTY MAP — Outline
   * 8-county Greater Houston metro outline for the geographic
   * scope selector. Each county is a separate path for highlighting.
   */
  countyMapOutline: graphic(
    'houston/county-map.svg',
    'Simple outline map of the 8-county Greater Houston metro: Harris (center), Fort Bend (SW), Montgomery (N), Galveston (SE), Brazoria (S), Liberty (NE), Waller (NW), Chambers (E). Each county as a separate SVG path so they can be individually colored/highlighted. Clean lines, no labels (labels added in code).',
    '600x500',
    'svg',
    'Geographic scope selector, metro overview, county filter UI',
  ),

  /**
   * NEIGHBORHOOD PATTERN — Repeating tile
   * A subtle repeating pattern inspired by Houston's shotgun house
   * rooflines / Heights Victorian gingerbread trim.
   * Used as a background texture.
   */
  neighborhoodPattern: graphic(
    'houston/neighborhood-pattern.svg',
    'Subtle repeating tile pattern inspired by Heights Victorian house trim / shotgun house rooflines. Very delicate, designed for use at 3-5% opacity as a background texture. Single color. Tileable in both directions.',
    '200x200',
    'svg',
    'Background texture for section backgrounds',
  ),

  /**
   * WARD MARKERS — Per-ward identity icons (6)
   * Small icons for each historic ward, used when displaying
   * ward-specific content or neighborhood guides.
   */
  wardMarkerFirstWard: graphic(
    'houston/wards/first-ward.svg',
    'First Ward identity icon — small mark evoking the arts/gallery district. Could be a paintbrush, gallery frame, or studio window. Single color line art.',
    '48x48',
    'svg',
    'First Ward marker icon in neighborhood content',
  ),
  wardMarkerSecondWard: graphic(
    'houston/wards/second-ward.svg',
    'Second Ward / East End identity icon — evoking Latino culture. Could be a mural brush stroke, Navigation Blvd landmark, or Guadalupe motif. Single color line art.',
    '48x48',
    'svg',
    'Second Ward marker icon in neighborhood content',
  ),
  wardMarkerThirdWard: graphic(
    'houston/wards/third-ward.svg',
    'Third Ward identity icon — evoking historically Black community, education. Could be a shotgun house silhouette, TSU tower, or Project Row Houses motif. Single color line art.',
    '48x48',
    'svg',
    'Third Ward marker icon in neighborhood content',
  ),
  wardMarkerFourthWard: graphic(
    'houston/wards/fourth-ward.svg',
    'Fourth Ward / Freedmen\'s Town identity icon — evoking civil rights, liberation. Could be Emancipation Park gate, historic brick, or freedom motif. Single color line art.',
    '48x48',
    'svg',
    'Fourth Ward marker icon in neighborhood content',
  ),
  wardMarkerFifthWard: graphic(
    'houston/wards/fifth-ward.svg',
    'Fifth Ward / "The Nickel" identity icon — evoking industry, resilience. Could be railroad crossing, industrial chimney, or work tools. Single color line art.',
    '48x48',
    'svg',
    'Fifth Ward marker icon in neighborhood content',
  ),
  wardMarkerSixthWard: graphic(
    'houston/wards/sixth-ward.svg',
    'Sixth Ward identity icon — evoking preservation, Victorian cottages. Could be gingerbread trim detail, historic district marker, or cottage silhouette. Single color line art.',
    '48x48',
    'svg',
    'Sixth Ward marker icon in neighborhood content',
  ),
}

// ── CONTENT TYPE BADGES ────────────────────────────────────────────────
// Small icons for content type identification on cards.

export const CONTENT_TYPE_GRAPHICS = {
  article: graphic('content-types/article.svg', 'Newspaper/article icon — simple document with text lines. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  report: graphic('content-types/report.svg', 'Report/PDF icon — document with chart or data visual. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  video: graphic('content-types/video.svg', 'Play button / video icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  event: graphic('content-types/event.svg', 'Calendar with pin icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  guide: graphic('content-types/guide.svg', 'Compass or step-by-step icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  tool: graphic('content-types/tool.svg', 'Wrench/calculator icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  course: graphic('content-types/course.svg', 'Graduation cap or book stack icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  campaign: graphic('content-types/campaign.svg', 'Megaphone or raised fist icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  dataset: graphic('content-types/dataset.svg', 'Bar chart or data table icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
  opportunity: graphic('content-types/opportunity.svg', 'Hand raised / volunteer icon. Single color line art.', '24x24', 'svg', 'Content type badge on cards'),
}

// ── ORG ACTION ICONS ───────────────────────────────────────────────────
// Icons for the Newsletter / Volunteer / Donate action bar on org pages.

export const ORG_ACTION_GRAPHICS = {
  newsletter: graphic('org-actions/newsletter.svg', 'Envelope with small plus or subscribe indicator. Line art, bayou blue.', '32x32', 'svg', 'Org page newsletter CTA icon'),
  volunteer: graphic('org-actions/volunteer.svg', 'Two hands or raised hand — volunteering. Line art, bayou green.', '32x32', 'svg', 'Org page volunteer CTA icon'),
  donate: graphic('org-actions/donate.svg', 'Heart or seed in hand — giving/generosity. Line art, clay/terracotta.', '32x32', 'svg', 'Org page donate CTA icon'),
  events: graphic('org-actions/events.svg', 'Calendar with star — upcoming events. Line art, voice red.', '32x32', 'svg', 'Org page events CTA icon'),
  careers: graphic('org-actions/careers.svg', 'Briefcase or door — job openings. Line art, money gold.', '32x32', 'svg', 'Org page careers CTA icon'),
}

// ── COUNTY IDENTITY PHOTOS ─────────────────────────────────────────────
// Each county gets a representative photo for geographic context.

export const COUNTY_GRAPHICS = {
  harris: graphic(
    'counties/harris.webp',
    'Harris County: Downtown Houston skyline from Buffalo Bayou Park, showing the urban core with bayou greenway in foreground. The heart of the metro.',
    '800x400',
    'webp',
    'Harris County identifier photo on geo pages',
  ),
  fortBend: graphic(
    'counties/fort-bend.webp',
    'Fort Bend County: Sugar Land Town Square or Missouri City streetscape — diverse suburban character. Master-planned community feel with mature trees and walkable commercial district.',
    '800x400',
    'webp',
    'Fort Bend County identifier photo on geo pages',
  ),
  montgomery: graphic(
    'counties/montgomery.webp',
    'Montgomery County: The Woodlands forested pathway or Lake Conroe shoreline. Piney woods canopy, showing the contrast with Houston\'s urban core. Green, shaded, natural.',
    '800x400',
    'webp',
    'Montgomery County identifier photo on geo pages',
  ),
  galveston: graphic(
    'counties/galveston.webp',
    'Galveston County: The Strand District Victorian facades, or the Seawall with waves. Historical brick buildings with ornate ironwork — Galveston\'s distinct identity from Houston. Coastal light.',
    '800x400',
    'webp',
    'Galveston County identifier photo on geo pages',
  ),
  brazoria: graphic(
    'counties/brazoria.webp',
    'Brazoria County: Pearland suburban transition landscape or Brazos River bend. Mix of newer development and coastal prairie. Shows the southern growth corridor.',
    '800x400',
    'webp',
    'Brazoria County identifier photo on geo pages',
  ),
  liberty: graphic(
    'counties/liberty.webp',
    'Liberty County: Trinity River or rural East Texas landscape. Open space, timber country, wide sky. The rural edge of the metro area.',
    '800x400',
    'webp',
    'Liberty County identifier photo on geo pages',
  ),
  waller: graphic(
    'counties/waller.webp',
    'Waller County: Prairie View A&M campus or agricultural landscape. Rolling prairie, farmland, the western rural edge. Historic HBCU presence.',
    '800x400',
    'webp',
    'Waller County identifier photo on geo pages',
  ),
  chambers: graphic(
    'counties/chambers.webp',
    'Chambers County: Anahuac wildlife refuge or Trinity Bay marshland. Coastal wetlands, shrimp boats, rice fields. The quiet eastern edge where the metro meets the Gulf.',
    '800x400',
    'webp',
    'Chambers County identifier photo on geo pages',
  ),
}

// ── HELPER ──────────────────────────────────────────────────────────────

/** Get all graphics as a flat array for inventory/upload checklist */
export function getAllGraphics(): WebGraphic[] {
  return [
    ...Object.values(HOME_GRAPHICS),
    ...Object.values(PATHWAY_GRAPHICS),
    ...Object.values(TRAIL_GRAPHICS),
    ...Object.values(ENGAGEMENT_GRAPHICS),
    ...Object.values(HOUSTON_GRAPHICS),
    ...Object.values(CONTENT_TYPE_GRAPHICS),
    ...Object.values(ORG_ACTION_GRAPHICS),
    ...Object.values(COUNTY_GRAPHICS),
  ]
}

/** Get upload checklist as markdown */
export function getUploadChecklist(): string {
  const graphics = getAllGraphics()
  const lines = graphics.map(
    (g) => `- [ ] \`${g.path}\` (${g.dimensions}, ${g.format})\n      ${g.description}`,
  )
  return `# Web Graphics Upload Checklist\n\n${graphics.length} images needed.\n\nDirectory: public/images/guide/\nURL pattern: ${BASE_PATH}/[path]\n\n${lines.join('\n\n')}`
}
