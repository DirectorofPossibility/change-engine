/**
 * All 53 InfoBubble tooltip definitions for Community Exchange.
 * Grouped by section. Text is resolved via i18n keys at render time.
 */

export interface TooltipDef {
  id: string
  /** i18n key — resolved by WayfinderTooltip using t() */
  i18nKey: string
  section: string
}

export const TOOLTIPS: Record<string, TooltipDef> = {
  // ── I. GLOBAL NAVIGATION ──
  zip_input: { id: 'zip_input', section: 'nav', i18nKey: 'tip.zip_input' },
  language_switcher: { id: 'language_switcher', section: 'nav', i18nKey: 'tip.language_switcher' },
  search_icon: { id: 'search_icon', section: 'nav', i18nKey: 'tip.search_icon' },
  pathway_dots: { id: 'pathway_dots', section: 'nav', i18nKey: 'tip.pathway_dots' },
  dropdown_discover: { id: 'dropdown_discover', section: 'nav', i18nKey: 'tip.dropdown_discover' },
  dropdown_learn: { id: 'dropdown_learn', section: 'nav', i18nKey: 'tip.dropdown_learn' },
  dropdown_act: { id: 'dropdown_act', section: 'nav', i18nKey: 'tip.dropdown_act' },
  dropdown_about: { id: 'dropdown_about', section: 'nav', i18nKey: 'tip.dropdown_about' },

  // ── II. HOMEPAGE ──
  persona_cards: { id: 'persona_cards', section: 'home', i18nKey: 'tip.persona_cards' },
  pathway_cards: { id: 'pathway_cards', section: 'home', i18nKey: 'tip.pathway_cards' },
  stats_bar: { id: 'stats_bar', section: 'home', i18nKey: 'tip.stats_bar' },

  // ── III. OFFICIALS PAGE ──
  zip_lookup: { id: 'zip_lookup', section: 'officials', i18nKey: 'tip.zip_lookup' },
  level_badges: { id: 'level_badges', section: 'officials', i18nKey: 'tip.level_badges' },
  party_label: { id: 'party_label', section: 'officials', i18nKey: 'tip.party_label' },

  // ── IV. SERVICES PAGE ──
  badge_211: { id: 'badge_211', section: 'services', i18nKey: 'tip.badge_211' },
  map_view_toggle: { id: 'map_view_toggle', section: 'services', i18nKey: 'tip.map_view_toggle' },
  service_type_tags: { id: 'service_type_tags', section: 'services', i18nKey: 'tip.service_type_tags' },

  // ── V. POLICIES & LEGISLATION ──
  gov_level_filter: { id: 'gov_level_filter', section: 'policies', i18nKey: 'tip.gov_level_filter' },
  status_badge: { id: 'status_badge', section: 'policies', i18nKey: 'tip.status_badge' },
  for_against: { id: 'for_against', section: 'policies', i18nKey: 'tip.for_against' },

  // ── VI. ELECTIONS & VOTING ──
  election_countdown: { id: 'election_countdown', section: 'elections', i18nKey: 'tip.election_countdown' },
  registration_deadline: { id: 'registration_deadline', section: 'elections', i18nKey: 'tip.registration_deadline' },
  polling_finder: { id: 'polling_finder', section: 'elections', i18nKey: 'tip.polling_finder' },

  // ── VII. LEARNING PATHS ──
  difficulty_badge: { id: 'difficulty_badge', section: 'learning', i18nKey: 'tip.difficulty_badge' },
  estimated_minutes: { id: 'estimated_minutes', section: 'learning', i18nKey: 'tip.estimated_minutes' },
  quiz_indicator: { id: 'quiz_indicator', section: 'learning', i18nKey: 'tip.quiz_indicator' },
  module_media_pills: { id: 'module_media_pills', section: 'learning', i18nKey: 'tip.module_media_pills' },

  // ── VIII. LIBRARY & RESEARCH ──
  ai_summary_badge: { id: 'ai_summary_badge', section: 'library', i18nKey: 'tip.ai_summary_badge' },
  chat_with_chance: { id: 'chat_with_chance', section: 'library', i18nKey: 'tip.chat_with_chance' },
  source_attribution: { id: 'source_attribution', section: 'library', i18nKey: 'tip.source_attribution' },

  // ── IX. ORGANIZATIONS & FOUNDATIONS ──
  org_action_buttons: { id: 'org_action_buttons', section: 'organizations', i18nKey: 'tip.org_action_buttons' },
  foundation_galaxy: { id: 'foundation_galaxy', section: 'foundations', i18nKey: 'tip.foundation_galaxy' },
  ntee_code: { id: 'ntee_code', section: 'organizations', i18nKey: 'tip.ntee_code' },

  // ── X. OPPORTUNITIES & EVENTS ──
  time_commitment: { id: 'time_commitment', section: 'opportunities', i18nKey: 'tip.time_commitment' },
  virtual_badge: { id: 'virtual_badge', section: 'opportunities', i18nKey: 'tip.virtual_badge' },
  spots_available: { id: 'spots_available', section: 'opportunities', i18nKey: 'tip.spots_available' },

  // ── XI. NEIGHBORHOODS & GEOGRAPHY ──
  super_neighborhood_number: { id: 'super_neighborhood_number', section: 'neighborhoods', i18nKey: 'tip.super_neighborhood_number' },
  population_income: { id: 'population_income', section: 'neighborhoods', i18nKey: 'tip.population_income' },
  geojson_boundaries: { id: 'geojson_boundaries', section: 'neighborhoods', i18nKey: 'tip.geojson_boundaries' },

  // ── XII. DETAIL PAGE WAYFINDER ──
  wayfinder_panel: { id: 'wayfinder_panel', section: 'detail', i18nKey: 'tip.wayfinder_panel' },
  focus_area_dots: { id: 'focus_area_dots', section: 'detail', i18nKey: 'tip.focus_area_dots' },
  engagement_tiers: { id: 'engagement_tiers', section: 'detail', i18nKey: 'tip.engagement_tiers' },
  taxonomy_section: { id: 'taxonomy_section', section: 'detail', i18nKey: 'tip.taxonomy_section' },
  suggest_edit: { id: 'suggest_edit', section: 'detail', i18nKey: 'tip.suggest_edit' },

  // ── XIII. USER ACCOUNT ──
  impact_points: { id: 'impact_points', section: 'account', i18nKey: 'tip.impact_points' },
  badges: { id: 'badges', section: 'account', i18nKey: 'tip.badges' },
  role_badge: { id: 'role_badge', section: 'account', i18nKey: 'tip.role_badge' },
  gamification_toggle: { id: 'gamification_toggle', section: 'account', i18nKey: 'tip.gamification_toggle' },
  neighbor_vs_partner: { id: 'neighbor_vs_partner', section: 'account', i18nKey: 'tip.neighbor_vs_partner' },

  // ── XIV. CONTENT CARDS (GLOBAL) ──
  pathway_color_bar: { id: 'pathway_color_bar', section: 'cards', i18nKey: 'tip.pathway_color_bar' },
  content_type_badge: { id: 'content_type_badge', section: 'cards', i18nKey: 'tip.content_type_badge' },
  source_attribution_card: { id: 'source_attribution_card', section: 'cards', i18nKey: 'tip.source_attribution_card' },
  translation_indicator: { id: 'translation_indicator', section: 'cards', i18nKey: 'tip.translation_indicator' },
}
