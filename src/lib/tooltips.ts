/**
 * All 53 InfoBubble tooltip definitions for Community Exchange.
 * Grouped by section. Copy is final — 6th-grade reading level.
 */

export interface TooltipDef {
  id: string
  text: string
  section: string
}

export const TOOLTIPS: Record<string, TooltipDef> = {
  // ── I. GLOBAL NAVIGATION ──
  zip_input: {
    id: 'zip_input',
    section: 'nav',
    text: 'Your ZIP code helps us show you your elected officials, nearby services, and what\u2019s happening in your area.',
  },
  language_switcher: {
    id: 'language_switcher',
    section: 'nav',
    text: 'Read this in English, Spanish, or Vietnamese. Switch any time \u2014 no account needed.',
  },
  search_icon: {
    id: 'search_icon',
    section: 'nav',
    text: 'Search for officials, services, organizations, news, policies, and more. All in one place.',
  },
  pathway_dots: {
    id: 'pathway_dots',
    section: 'nav',
    text: 'Each dot is a theme. Tap one to explore everything connected to it.',
  },
  dropdown_discover: {
    id: 'dropdown_discover',
    section: 'nav',
    text: 'Find resources, services, and civic life in your neighborhood.',
  },
  dropdown_learn: {
    id: 'dropdown_learn',
    section: 'nav',
    text: 'Understand how government works \u2014 and how to use it.',
  },
  dropdown_act: {
    id: 'dropdown_act',
    section: 'nav',
    text: 'Take real action. Call your representatives. Volunteer. Vote.',
  },
  dropdown_about: {
    id: 'dropdown_about',
    section: 'nav',
    text: 'Learn about The Change Lab and how this platform works.',
  },

  // ── II. HOMEPAGE ──
  persona_cards: {
    id: 'persona_cards',
    section: 'home',
    text: 'Not an account type \u2014 just a lens. Pick one to see the page organized around what matters most to you. Switch any time.',
  },
  pathway_cards: {
    id: 'pathway_cards',
    section: 'home',
    text: 'Each pathway is a theme \u2014 like housing or health. Tap to explore everything connected to it.',
  },
  stats_bar: {
    id: 'stats_bar',
    section: 'home',
    text: 'Live numbers from our database. Updated every morning from public data sources.',
  },

  // ── III. OFFICIALS PAGE ──
  zip_lookup: {
    id: 'zip_lookup',
    section: 'officials',
    text: 'Your ZIP overlaps multiple districts. We find all of them \u2014 city, county, state, federal \u2014 and show you every person who represents you.',
  },
  level_badges: {
    id: 'level_badges',
    section: 'officials',
    text: 'Federal = Washington, D.C.  State = Austin.  County = Harris County.  City = Houston.',
  },
  party_label: {
    id: 'party_label',
    section: 'officials',
    text: 'The political party this official belongs to.',
  },

  // ── IV. SERVICES PAGE ──
  badge_211: {
    id: 'badge_211',
    section: 'services',
    text: '211 is Texas\u2019s free help line for health and human services. Call 2-1-1 any time \u2014 real people answer and help you find what you need.',
  },
  map_view_toggle: {
    id: 'map_view_toggle',
    section: 'services',
    text: 'Switch between a list and a map. The map shows where services are near you.',
  },
  service_type_tags: {
    id: 'service_type_tags',
    section: 'services',
    text: 'Categories to help you find the right kind of help \u2014 food, housing, health, legal, and more.',
  },

  // ── V. POLICIES & LEGISLATION ──
  gov_level_filter: {
    id: 'gov_level_filter',
    section: 'policies',
    text: 'Filter by which level of government is working on this \u2014 city, county, state, or federal.',
  },
  status_badge: {
    id: 'status_badge',
    section: 'policies',
    text: 'Where this bill is right now \u2014 introduced, in committee, passed, or signed into law.',
  },
  for_against: {
    id: 'for_against',
    section: 'policies',
    text: 'What supporters say. What opponents say. No spin \u2014 just the main points on each side, in plain language.',
  },

  // ── VI. ELECTIONS & VOTING ──
  election_countdown: {
    id: 'election_countdown',
    section: 'elections',
    text: 'Days until the next election. Early voting in Texas usually starts two weeks before Election Day.',
  },
  registration_deadline: {
    id: 'registration_deadline',
    section: 'elections',
    text: 'In Texas, you have to register at least 30 days before an election. Don\u2019t wait.',
  },
  polling_finder: {
    id: 'polling_finder',
    section: 'elections',
    text: 'Enter your address to find exactly where to vote \u2014 your assigned location plus early voting sites near you.',
  },

  // ── VII. LEARNING PATHS ──
  difficulty_badge: {
    id: 'difficulty_badge',
    section: 'learning',
    text: 'Beginner: start from zero.  Intermediate: builds on the basics.  Advanced: for people ready to go deeper.',
  },
  estimated_minutes: {
    id: 'estimated_minutes',
    section: 'learning',
    text: 'How long it takes to finish \u2014 reading, videos, and activities included.',
  },
  quiz_indicator: {
    id: 'quiz_indicator',
    section: 'learning',
    text: 'A short check at the end. Not graded \u2014 just to help it stick.',
  },
  module_media_pills: {
    id: 'module_media_pills',
    section: 'learning',
    text: 'Resources from trusted sources \u2014 TED, PBS, community organizations. We link to them. We don\u2019t replace them.',
  },

  // ── VIII. LIBRARY & RESEARCH ──
  ai_summary_badge: {
    id: 'ai_summary_badge',
    section: 'library',
    text: 'AI wrote this summary to make the content easier to read. The original source is linked below \u2014 we didn\u2019t replace it.',
  },
  chat_with_chance: {
    id: 'chat_with_chance',
    section: 'library',
    text: 'Chance is an AI assistant built on Houston community data. Ask anything \u2014 officials, services, policies, how things work.',
  },
  source_attribution: {
    id: 'source_attribution',
    section: 'library',
    text: 'This content was created by this organization. We summarized it. Click through to read the original.',
  },

  // ── IX. ORGANIZATIONS & FOUNDATIONS ──
  org_action_buttons: {
    id: 'org_action_buttons',
    section: 'organizations',
    text: 'Direct links to this organization\u2019s volunteer page, donation page, or event calendar \u2014 wherever they want you to go next.',
  },
  foundation_galaxy: {
    id: 'foundation_galaxy',
    section: 'foundations',
    text: 'Each dot is a foundation. Bigger = more funding. Color = primary theme. Click any dot to learn more.',
  },
  ntee_code: {
    id: 'ntee_code',
    section: 'organizations',
    text: 'A national code that classifies nonprofits by what they do. Used by the IRS and researchers to organize the sector.',
  },

  // ── X. OPPORTUNITIES & EVENTS ──
  time_commitment: {
    id: 'time_commitment',
    section: 'opportunities',
    text: 'How much of your time this takes \u2014 one-time, weekly, monthly, or ongoing. No surprises.',
  },
  virtual_badge: {
    id: 'virtual_badge',
    section: 'opportunities',
    text: 'You can do this from home. No travel needed.',
  },
  spots_available: {
    id: 'spots_available',
    section: 'opportunities',
    text: 'How many openings are left. First come, first served.',
  },

  // ── XI. NEIGHBORHOODS & GEOGRAPHY ──
  super_neighborhood_number: {
    id: 'super_neighborhood_number',
    section: 'neighborhoods',
    text: 'Houston has 88 super neighborhoods. Each one has a council that gives input to City Hall on local decisions.',
  },
  population_income: {
    id: 'population_income',
    section: 'neighborhoods',
    text: 'U.S. Census data \u2014 used to understand what communities need and how resources get distributed.',
  },
  geojson_boundaries: {
    id: 'geojson_boundaries',
    section: 'neighborhoods',
    text: 'Map boundaries from the City of Houston Planning Department. Updated when official boundaries change.',
  },

  // ── XII. DETAIL PAGE WAYFINDER ──
  wayfinder_panel: {
    id: 'wayfinder_panel',
    section: 'detail',
    text: 'Everything connected to what you\u2019re looking at \u2014 officials, services, organizations, policies, and news that share the same focus areas. Three hops out from any starting point.',
  },
  focus_area_dots: {
    id: 'focus_area_dots',
    section: 'detail',
    text: 'Focus areas are specific topics inside a pathway. Tap any dot to explore everything tagged with it.',
  },
  engagement_tiers: {
    id: 'engagement_tiers',
    section: 'detail',
    text: 'Understand: learn what\u2019s happening.  Get Involved: take action.  Go Deeper: follow the systems that shape it.',
  },
  taxonomy_section: {
    id: 'taxonomy_section',
    section: 'detail',
    text: 'How this item is classified \u2014 pathway, focus area, UN goals, and federal codes. Useful for researchers and partners.',
  },
  suggest_edit: {
    id: 'suggest_edit',
    section: 'detail',
    text: 'See something wrong or outdated? Tell us. Community members help keep this accurate.',
  },

  // ── XIII. USER ACCOUNT ──
  impact_points: {
    id: 'impact_points',
    section: 'account',
    text: 'Points earned by completing learning modules, taking civic action, and engaging with community resources.',
  },
  badges: {
    id: 'badges',
    section: 'account',
    text: 'Earned by finishing learning paths, attending events, and showing up. Each one marks something real you did.',
  },
  role_badge: {
    id: 'role_badge',
    section: 'account',
    text: 'Member: browse and learn.  Neighbor: submit resources and track activity.  Partner: manage your organization, post events, access analytics.',
  },
  gamification_toggle: {
    id: 'gamification_toggle',
    section: 'account',
    text: 'Turn badges and points on or off. Your progress is still saved either way \u2014 this just changes whether you see it.',
  },
  neighbor_vs_partner: {
    id: 'neighbor_vs_partner',
    section: 'account',
    text: 'Neighbor accounts are free for individuals. Partner accounts \u2014 for organizations \u2014 start at $100/year and include tools for managing your presence on the platform.',
  },

  // ── XIV. CONTENT CARDS (GLOBAL) ──
  pathway_color_bar: {
    id: 'pathway_color_bar',
    section: 'cards',
    text: 'The color shows which pathway this belongs to. Hover to see the name.',
  },
  content_type_badge: {
    id: 'content_type_badge',
    section: 'cards',
    text: 'How this is meant to be used \u2014 article, video, report, tool, event, or course.',
  },
  source_attribution_card: {
    id: 'source_attribution_card',
    section: 'cards',
    text: 'The organization that created this. We link to them. We don\u2019t replace them.',
  },
  translation_indicator: {
    id: 'translation_indicator',
    section: 'cards',
    text: 'This is available in your selected language.',
  },
}
