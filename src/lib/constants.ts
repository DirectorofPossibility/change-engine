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
  THEME_01: { name: 'Our Health', color: '#e53e3e', slug: 'our-health', emoji: '' },
  THEME_02: { name: 'Our Families', color: '#dd6b20', slug: 'our-families', emoji: '' },
  THEME_03: { name: 'Our Neighborhood', color: '#d69e2e', slug: 'our-neighborhood', emoji: '' },
  THEME_04: { name: 'Our Voice', color: '#38a169', slug: 'our-voice', emoji: '' },
  THEME_05: { name: 'Our Money', color: '#3182ce', slug: 'our-money', emoji: '' },
  THEME_06: { name: 'Our Planet', color: '#319795', slug: 'our-planet', emoji: '' },
  THEME_07: { name: 'The Bigger We', color: '#805ad5', slug: 'the-bigger-we', emoji: '' },
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
