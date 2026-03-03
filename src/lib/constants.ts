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
  THEME_01: { name: 'Our Health', color: '#e53e3e', slug: 'our-health', emoji: '', description: 'Wellness, healing, and care for every Houstonian. Explore clinics, mental health support, nutrition programs, and insurance options that keep our communities strong.' },
  THEME_02: { name: 'Our Families', color: '#dd6b20', slug: 'our-families', emoji: '', description: 'Strong foundations for every family. Find schools, childcare, youth programs, and safety resources that help Houston families grow and thrive.' },
  THEME_03: { name: 'Our Neighborhood', color: '#d69e2e', slug: 'our-neighborhood', emoji: '', description: 'The places we share and call home. Discover housing resources, parks, libraries, and neighborhood initiatives that make Houston a better place to live.' },
  THEME_04: { name: 'Our Voice', color: '#38a169', slug: 'our-voice', emoji: '', description: 'Your civic power, amplified. Get informed about voting, advocacy, town halls, and organizing opportunities that put your community in charge.' },
  THEME_05: { name: 'Our Money', color: '#3182ce', slug: 'our-money', emoji: '', description: 'Financial opportunity for everyone. Explore jobs, benefits, credit-building, and small business resources that strengthen economic well-being.' },
  THEME_06: { name: 'Our Planet', color: '#319795', slug: 'our-planet', emoji: '', description: 'Climate, environment, and sustainability in our region. Learn about air quality, flooding, energy programs, and green initiatives shaping Houston\'s future.' },
  THEME_07: { name: 'The Bigger We', color: '#805ad5', slug: 'the-bigger-we', emoji: '', description: 'Building across difference, together. Explore resources for bridging, dialogue, inclusion, and trust that connect all of Houston\'s communities.' },
} as const;

/**
 * Editorial intro paragraphs for key listing pages.
 * Consumed by PageHero for warm, asset-based page introductions.
 */
export const PAGE_INTROS = {
  services: 'Houston has a deep network of services and organizations dedicated to your well-being. Browse by category, search by need, or explore the map to find what is near you.',
  search: 'Explore everything The Change Engine has gathered for Houston — from articles and services to elected officials and community organizations.',
  explore: 'Every topic connects to something bigger. Browse focus areas across all seven pathways, filter by global goals, and discover how community issues interrelate.',
  elections: 'Your vote is your voice. Find upcoming elections, learn about candidates, check registration deadlines, and locate your polling place.',
  availableResources: 'No matter what you are facing, Houston has resources ready for you. Browse by urgency or life situation to find support, services, and next steps.',
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
  name: 'The Change Engine',
  tagline: 'Community Life, Organized',
  background: '#F5F1EB',
  text: '#2C2C2C',
  accent: '#C75B2A',
  muted: '#8B7E74',
  border: '#E8E3DB',
  cardBg: '#FFFFFF',
  success: '#38a169',
  warning: '#d69e2e',
  danger: '#e53e3e',
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
 * Available geographic boundary layers for Houston-area maps.
 * GeoJSON files live in /public/geo/ and are loaded client-side by GeoJsonLayer.
 * Layers can be toggled on/off via LayerControl in the InteractiveMap component.
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
    color: '#805ad5',
    idProperty: 'SN_ID',
    detailPath: '/super-neighborhoods/',
  },
  councilDistricts: {
    id: 'councilDistricts',
    label: 'Council Districts',
    url: '/geo/council-districts.geojson',
    color: '#38a169',
    idProperty: 'DISTRICT',
    detailPath: '/officials/',
  },
  congressionalDistricts: {
    id: 'congressionalDistricts',
    label: 'Congressional Districts',
    url: '/geo/congressional-districts.geojson',
    color: '#3182ce',
    idProperty: 'CD',
    detailPath: null,
  },
  stateSenate: {
    id: 'stateSenate',
    label: 'State Senate Districts',
    url: '/geo/state-senate-districts.geojson',
    color: '#e53e3e',
    idProperty: 'SD',
    detailPath: null,
  },
  stateHouse: {
    id: 'stateHouse',
    label: 'State House Districts',
    url: '/geo/state-house-districts.geojson',
    color: '#dd6b20',
    idProperty: 'HD',
    detailPath: null,
  },
  schoolDistricts: {
    id: 'schoolDistricts',
    label: 'School Districts',
    url: '/geo/school-districts.geojson',
    color: '#d69e2e',
    idProperty: 'SD_ID',
    detailPath: null,
  },
  zipCodes: {
    id: 'zipCodes',
    label: 'ZIP Codes',
    url: '/geo/zip-codes.geojson',
    color: '#319795',
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
} as const;
