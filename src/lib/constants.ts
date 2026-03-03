export const THEMES = {
  THEME_01: { name: 'Our Health', color: '#e53e3e', slug: 'our-health', emoji: '🏥' },
  THEME_02: { name: 'Our Families', color: '#dd6b20', slug: 'our-families', emoji: '👨‍👩‍👧‍👦' },
  THEME_03: { name: 'Our Neighborhood', color: '#d69e2e', slug: 'our-neighborhood', emoji: '🏘️' },
  THEME_04: { name: 'Our Voice', color: '#38a169', slug: 'our-voice', emoji: '📢' },
  THEME_05: { name: 'Our Money', color: '#3182ce', slug: 'our-money', emoji: '💰' },
  THEME_06: { name: 'Our Planet', color: '#319795', slug: 'our-planet', emoji: '🌍' },
  THEME_07: { name: 'The Bigger We', color: '#805ad5', slug: 'the-bigger-we', emoji: '🤝' },
} as const;

export const CENTERS: Record<string, { question: string; emoji: string; slug: string }> = {
  Learning:       { question: 'How can I understand?', emoji: '📚', slug: 'learning' },
  Action:         { question: 'How can I help?', emoji: '✊', slug: 'action' },
  Resource:       { question: "What's available to me?", emoji: '📋', slug: 'resources' },
  Accountability: { question: 'Who makes decisions?', emoji: '🏛️', slug: 'accountability' },
};

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

export const PERSONAS = [
  { id: 'starter', name: 'Starter', tagline: 'I want to get involved but don\'t know where to begin.' },
  { id: 'hard-worker', name: 'Hard Worker', tagline: 'I need resources and I want to give back.' },
  { id: 'next-steps', name: 'Next Steps', tagline: 'I\'m already active. What\'s next?' },
  { id: 'looking-for-answers', name: 'Looking for Answers', tagline: 'I have a specific question or need.' },
  { id: 'spark-plug', name: 'Spark Plug', tagline: 'I want to lead and organize.' },
  { id: 'bridge-builder', name: 'Bridge Builder', tagline: 'I want to connect across divides.' },
  { id: 'scout', name: 'Scout', tagline: 'I want to explore what\'s out there.' },
  { id: 'register', name: 'Register', tagline: 'I want to vote and participate in democracy.' },
] as const;

export const LANGUAGES = [
  { code: 'en' as const, label: 'EN', name: 'English', langId: null },
  { code: 'es' as const, label: 'ES', name: 'Español', langId: 'LANG-ES' },
  { code: 'vi' as const, label: 'VI', name: 'Tiếng Việt', langId: 'LANG-VI' },
] as const;

export interface GeoLayerConfig {
  id: string
  label: string
  url: string
  color: string
  idProperty: string
  detailPath: string | null
}

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
