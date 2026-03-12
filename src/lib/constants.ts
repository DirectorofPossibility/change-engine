/**
 * @fileoverview Application-wide constants for The Change Engine.
 *
 * Architecture overview:
 *   Content is organized via a dual taxonomy:
 *     - 7 Pathways (THEMES)  — thematic lenses (health, families, money, etc.)
 *     - 4 Centers  (CENTERS) — user-intent modes (learning, action, resource, accountability)
 *   Every piece of content is classified into one pathway + one center during ingestion.
 *
 *   The brand palette, supported languages, and geographic boundary layers are also
 *   defined here so they stay consistent across the public site and admin dashboard.
 */

/**
 * The 7 Pathways — thematic lenses through which all content is organized.
 * IDs (THEME_01–THEME_07) match the `themes` table primary keys in Supabase.
 * Colors are used for pills, charts, and pathway cards across the UI.
 */
export const THEMES = {
  THEME_01: { name: 'Health', color: '#1a6b56', slug: 'health', emoji: '', description: 'Wellness, healing, and care for every Houstonian. Explore clinics, mental health support, nutrition programs, and insurance options that keep our communities strong.' },
  THEME_02: { name: 'Families', color: '#1e4d7a', slug: 'families', emoji: '', description: 'Strong foundations for every family. Find schools, childcare, youth programs, and safety resources that help Houston families grow and thrive.' },
  THEME_03: { name: 'Neighborhood', color: '#4a2870', slug: 'neighborhood', emoji: '', description: 'The places we share and call home. Discover housing resources, parks, libraries, and neighborhood initiatives that make Houston a better place to live.' },
  THEME_04: { name: 'Voice', color: '#7a2018', slug: 'voice', emoji: '', description: 'Your civic power, amplified. Get informed about voting, advocacy, town halls, and organizing opportunities that put your community in charge.' },
  THEME_05: { name: 'Money', color: '#6a4e10', slug: 'money', emoji: '', description: 'Financial opportunity for everyone. Explore jobs, benefits, credit-building, and small business resources that strengthen economic well-being.' },
  THEME_06: { name: 'Planet', color: '#1a5030', slug: 'planet', emoji: '', description: 'Climate, environment, and sustainability in our region. Learn about air quality, flooding, energy programs, and green initiatives shaping Houston\'s future.' },
  THEME_07: { name: 'The Bigger We', color: '#1a3460', slug: 'the-bigger-we', emoji: '', description: 'Building across difference, together. Explore resources for bridging, dialogue, inclusion, and trust that connect all of Houston\'s communities.' },
} as const;

/**
 * Editorial intro paragraphs for key listing pages.
 * Consumed by PageHero for warm, asset-based page introductions.
 */
export const PAGE_INTROS = {
  services: 'Houston has a deep network of services and organizations dedicated to your well-being. Browse by category, search by need, or explore the map to find what is near you.',
  search: 'Search everything — officials, services, organizations, news, policies, opportunities. Use the tabs to narrow it down, or search across all of it at once.',
  explore: 'Every topic connects to something bigger. Browse focus areas across all seven pathways, filter by global goals, and discover how community issues interrelate.',
  elections: 'Your voting dashboard — see what just happened, what\'s coming up, who represents you, and where to vote. Start with your ZIP code to personalize your experience.',
  availableResources: 'No matter what you are facing, Houston has resources ready for you. Browse by urgency or life situation to find support, services, and next steps.',
  organizations: 'Houston is powered by hundreds of nonprofits, foundations, agencies, and community groups working to strengthen neighborhoods. Browse, search, and connect with the organizations serving your community.',
  geography: 'Explore Houston through its neighborhoods, districts, and civic boundaries. Toggle boundary layers, click any area, or search by ZIP code to discover services, officials, organizations, and foundations near you.',
} as const;

/**
 * The 4 Centers — user-intent modes that cut across all pathways.
 * Each center answers a distinct question a community member might ask.
 * Used for homepage cards, content filtering, and the classification prompt.
 */
export const CENTERS: Record<string, { question: string; emoji: string; slug: string }> = {
  Learning:       { question: 'How can I understand?', emoji: '', slug: 'learning' },
  Action:         { question: 'How can I help?', emoji: '', slug: 'action' },
  Resource:       { question: "What's available to me?", emoji: '', slug: 'resources' },
  Accountability: { question: 'Who makes decisions?', emoji: '', slug: 'accountability' },
};

/**
 * Brand identity tokens. These map to Tailwind CSS custom colors defined
 * in tailwind.config.ts (e.g. `text-brand-accent`, `bg-brand-bg`).
 * Keep these in sync with the Tailwind theme extension.
 */
export const BRAND = {
  name: 'Community Guide',
  tagline: 'A publication of The Change Lab',
  origin: 'Made in Houston, for everyone',
  background: '#ffffff',
  text: '#0d1117',
  accent: '#1b5e8a',
  muted: '#5c6474',
  border: '#dde1e8',
  cardBg: '#ffffff',
  dark: '#0d1117',
  success: '#16a34a',
  warning: '#6a4e10',
  danger: '#b03a2a',
} as const;

/**
 * Supported UI languages. Houston's top 3 languages.
 * `langId` maps to the `languages` table PK in Supabase (null = English, no translation needed).
 * Used by LanguageContext for client-side toggling and by the translation pipeline.
 */
export const LANGUAGES = [
  { code: 'en' as const, label: 'EN', name: 'English', langId: null },
  { code: 'es' as const, label: 'ES', name: 'Español', langId: 'LANG-ES' },
  { code: 'vi' as const, label: 'VI', name: 'Tiếng Việt', langId: 'LANG-VI' },
] as const;

/**
 * Configuration for a geographic boundary layer rendered on the map.
 * Each layer points to a static GeoJSON file in /public/geo/ and specifies
 * how to identify features (idProperty) and where to link for detail pages.
 */
export interface GeoLayerConfig {
  id: string
  label: string
  url: string
  color: string
  idProperty: string
  detailPath: string | null
}

/**
 * Available geographic boundary layers for maps.
 * GeoJSON files live in /public/geo/ and are loaded client-side by GeoJsonLayer.
 * Layers can be toggled on/off via LayerControl in the InteractiveMap component.
 *
 * Houston layers: /public/geo/*.geojson
 * San Francisco layers: /public/geo/sf/*.geojson
 *
 * idProperty — which GeoJSON feature property uniquely identifies a polygon
 *              (used for highlighting and linking to detail pages)
 * detailPath — if non-null, clicking a polygon navigates to `{detailPath}{featureId}`
 */
export const GEO_LAYERS: Record<string, GeoLayerConfig> = {
  superNeighborhoods: {
    id: 'superNeighborhoods',
    label: 'Super Neighborhoods',
    url: '/geo/super-neighborhoods.geojson',
    color: '#4a2870',
    idProperty: 'SN_ID',
    detailPath: '/super-neighborhoods/',
  },
  councilDistricts: {
    id: 'councilDistricts',
    label: 'Council Districts',
    url: '/geo/council-districts.geojson',
    color: '#1a6b56',
    idProperty: 'DISTRICT',
    detailPath: '/officials/',
  },
  congressionalDistricts: {
    id: 'congressionalDistricts',
    label: 'Congressional Districts',
    url: '/geo/congressional-districts.geojson',
    color: '#1b5e8a',
    idProperty: 'CD',
    detailPath: null,
  },
  stateSenate: {
    id: 'stateSenate',
    label: 'State Senate Districts',
    url: '/geo/state-senate-districts.geojson',
    color: '#7a2018',
    idProperty: 'SD',
    detailPath: null,
  },
  stateHouse: {
    id: 'stateHouse',
    label: 'State House Districts',
    url: '/geo/state-house-districts.geojson',
    color: '#1e4d7a',
    idProperty: 'HD',
    detailPath: null,
  },
  schoolDistricts: {
    id: 'schoolDistricts',
    label: 'School Districts',
    url: '/geo/school-districts.geojson',
    color: '#6a4e10',
    idProperty: 'SD_ID',
    detailPath: null,
  },
  zipCodes: {
    id: 'zipCodes',
    label: 'ZIP Codes',
    url: '/geo/zip-codes.geojson',
    color: '#1a5030',
    idProperty: 'ZCTA5CE20',
    detailPath: null,
  },
  censusTracts: {
    id: 'censusTracts',
    label: 'Census Tracts',
    url: '/geo/census-tracts.geojson',
    color: '#718096',
    idProperty: 'GEOID',
    detailPath: null,
  },
  tirzZones: {
    id: 'tirzZones',
    label: 'TIRZ Zones',
    url: '/geo/tirz-zones.geojson',
    color: '#b03a2a',
    idProperty: 'SITENO',
    detailPath: '/tirz/',
  },
} as const;

/**
 * San Francisco geographic boundary layers.
 * Separate from Houston GEO_LAYERS so they can be used independently.
 * GeoJSON files live in /public/geo/sf/ — run scripts/prepare-sf-geo.sh to download.
 */
export const SF_GEO_LAYERS: Record<string, GeoLayerConfig> = {
  sfSupervisorDistricts: {
    id: 'sfSupervisorDistricts',
    label: 'Supervisor Districts',
    url: '/geo/sf/supervisor-districts.geojson',
    color: '#1a6b56',
    idProperty: 'DISTRICT',
    detailPath: null,
  },
  sfNeighborhoods: {
    id: 'sfNeighborhoods',
    label: 'Neighborhoods',
    url: '/geo/sf/neighborhoods.geojson',
    color: '#4a2870',
    idProperty: 'nhood',
    detailPath: null,
  },
  sfZipCodes: {
    id: 'sfZipCodes',
    label: 'ZIP Codes',
    url: '/geo/sf/zip-codes.geojson',
    color: '#1a5030',
    idProperty: 'zip_code',
    detailPath: null,
  },
  sfPoliceDistricts: {
    id: 'sfPoliceDistricts',
    label: 'Police Districts',
    url: '/geo/sf/police-districts.geojson',
    color: '#7a2018',
    idProperty: 'DISTRICT',
    detailPath: null,
  },
  sfCensusTracts: {
    id: 'sfCensusTracts',
    label: 'Census Tracts',
    url: '/geo/sf/census-tracts.geojson',
    color: '#718096',
    idProperty: 'GEOID',
    detailPath: null,
  },
  sfParks: {
    id: 'sfParks',
    label: 'Parks & Open Space',
    url: '/geo/sf/parks.geojson',
    color: '#2D8659',
    idProperty: 'MAP_LABEL',
    detailPath: null,
  },
} as const;

/**
 * Map center coordinates by city.
 */
export const MAP_CENTERS = {
  houston: { lat: 29.76, lng: -95.37, zoom: 10 },
  sanFrancisco: { lat: 37.7749, lng: -122.4194, zoom: 12 },
} as const;

// ── Shared color systems ─────────────────────────────────────────────

/** Government level → hex color. Used by OfficialCard, policy pages, etc. */
export const LEVEL_COLORS: Record<string, string> = {
  Federal: '#1b5e8a',
  State: '#4a2870',
  County: '#6a4e10',
  City: '#1a6b56',
  'School District': '#1e4d7a',
}

export const DEFAULT_LEVEL_COLOR = '#8B7E74'

/** Urgency level → Tailwind classes + gradient hex. Used by LifeSituationCard, help page, etc. */
export const URGENCY_COLORS: Record<string, { bg: string; border: string; text: string; gradientFrom: string; gradientTo: string }> = {
  Critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', gradientFrom: '#7a2018', gradientTo: '#5a1810' },
  High:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', gradientFrom: '#1e4d7a', gradientTo: '#163a5c' },
  Medium:   { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', gradientFrom: '#4a2870', gradientTo: '#381e55' },
  Low:      { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', gradientFrom: '#1a6b56', gradientTo: '#145242' },
}

/** Ordered urgency levels for rendering sections. */
export const URGENCY_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const

/** Urgency level → i18n key + Tailwind color classes. Used by HelpUrgencyHeader. */
export const URGENCY_CONFIG: Record<string, { key: string; color: string }> = {
  Critical: { key: 'help.urgency_critical', color: 'text-red-700 border-red-300 bg-red-50' },
  High:     { key: 'help.urgency_high', color: 'text-orange-700 border-orange-300 bg-orange-50' },
  Medium:   { key: 'help.urgency_medium', color: 'text-yellow-700 border-yellow-300 bg-yellow-50' },
  Low:      { key: 'help.urgency_low', color: 'text-green-700 border-green-300 bg-green-50' },
}

/** Guide engagement level → Tailwind badge classes. */
export const ENGAGEMENT_LEVEL_COLORS: Record<string, string> = {
  'On the Couch': 'bg-green-100 text-green-800',
  'Off the Couch': 'bg-blue-100 text-blue-800',
  'Use Your Superpower': 'bg-purple-100 text-purple-800',
}

/** Center → hex color. Used by FeedCard, CentersGrid, etc. */
export const CENTER_COLORS: Record<string, string> = {
  Learning: '#2563eb',
  Action: '#dc2626',
  Resource: '#16a34a',
  Accountability: '#9333ea',
}

/** Compass entry card prompts — maps center keys to i18n keys. */
export const COMPASS_PROMPTS: Record<string, { i18nKey: string; center: string }> = {
  Learning: { i18nKey: 'compass.understand', center: 'Learning' },
  Action: { i18nKey: 'compass.help', center: 'Action' },
  Resource: { i18nKey: 'compass.available', center: 'Resource' },
  Accountability: { i18nKey: 'compass.decides', center: 'Accountability' },
}
