/**
 * Taxonomy loading and prompt building for Claude classification.
 */

import { supaRest } from './supabase-helpers'

/**
 * Load the full classification taxonomy from Supabase.
 */
export async function fetchTaxonomy() {
  const get = (table: string, select = '*') =>
    supaRest('GET', `${table}?select=${select}&limit=500`)

  const [themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills, timeCommitments, actionTypes, govLevels] = await Promise.all([
    get('themes', 'theme_id,theme_name'),
    get('focus_areas', 'focus_id,focus_area_name,theme_id,sdg_id,ntee_code,airs_code,sdoh_code,is_bridging'),
    get('sdgs', 'sdg_id,sdg_number,sdg_name'),
    get('sdoh_domains', 'sdoh_code,sdoh_name'),
    get('ntee_codes', 'ntee_code,ntee_name'),
    get('airs_codes', 'airs_code,airs_name'),
    get('audience_segments', 'segment_id,segment_name,description'),
    get('life_situations', 'situation_id,situation_name,theme_id,urgency_level'),
    get('resource_types', 'resource_type_id,resource_type_name,center'),
    get('service_categories', 'service_cat_id,service_cat_name'),
    get('skills', 'skill_id,skill_name,skill_category'),
    get('time_commitments', 'time_id,time_name,min_minutes,max_minutes'),
    get('action_types', 'action_type_id,action_type_name,category'),
    get('government_levels', 'gov_level_id,gov_level_name'),
  ])

  return { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills, timeCommitments, actionTypes, govLevels }
}

export type Taxonomy = Awaited<ReturnType<typeof fetchTaxonomy>>

/**
 * Serialize the full taxonomy into a text prompt for Claude classification.
 */
export function buildTaxonomyPrompt(tax: Taxonomy): string {
  const themeList = tax.themes.map((t: any) => `${t.theme_id}: ${t.theme_name}`).join('\n')

  const faByTheme: Record<string, string[]> = {}
  for (const fa of tax.focusAreas) {
    const key = fa.theme_id || 'NONE'
    if (!faByTheme[key]) faByTheme[key] = []
    faByTheme[key].push(`${fa.focus_id}|${fa.focus_area_name}|sdg:${fa.sdg_id}|ntee:${fa.ntee_code}|airs:${fa.airs_code}|sdoh:${fa.sdoh_code}${fa.is_bridging ? '|BRIDGING' : ''}`)
  }
  let faText = ''
  for (const [themeId, fas] of Object.entries(faByTheme)) {
    const themeName = tax.themes.find((t: any) => t.theme_id === themeId)?.theme_name || themeId
    faText += `\n[${themeName}]\n${fas.join('\n')}\n`
  }

  const segList = tax.segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n')
  const sitList = tax.situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n')
  const rtList = tax.resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n')
  const scList = tax.serviceCats.map((s: any) => `${s.service_cat_id}: ${s.service_cat_name}`).join('\n')
  const skillList = tax.skills.map((s: any) => `${s.skill_id}: ${s.skill_name}`).join('\n')
  const timeList = tax.timeCommitments.map((t: any) => `${t.time_id}: ${t.time_name} (${t.min_minutes}-${t.max_minutes} min)`).join('\n')
  const actionList = tax.actionTypes.map((a: any) => `${a.action_type_id}: ${a.action_type_name} [${a.category}]`).join('\n')
  const govList = tax.govLevels.map((g: any) => `${g.gov_level_id}: ${g.gov_level_name}`).join('\n')

  return `## OBJECT TYPE MODEL
News is NOT resources. Content flowing through this pipeline is NEWSFEED content (articles, videos, research, reports, DIY activities, courses). Resources are separate entity types (services, organizations, benefits).

## ENGAGEMENT LEVELS (Centers)
Each piece of content serves one engagement level:
- Learning:       "How can I understand?" — news, research, reports, explainers, courses, videos
- Action:         "How can I help?"       — volunteer opportunities, campaigns, calls to action, events
- Resource:       "What's available?"      — services, organizations, benefit programs, tools
- Accountability: "Who makes decisions?"   — officials, policies, agencies, ballot items

## CLASSIFICATION DIMENSIONS
You must identify EVERY applicable dimension for each item:

THEMES / PATHWAYS (pick 1 primary + 0-2 secondary):
${themeList}

FOCUS AREAS (pick 1-4 by ID — the WHAT):
${faText}

CONTENT FORMAT / RESOURCE TYPE (pick 1 — what kind of content is this):
${rtList}

ENGAGEMENT LEVEL / CENTER (pick 1): Learning | Action | Resource | Accountability

AUDIENCE SEGMENTS (pick 1-3 — WHO is this for):
${segList}

LIFE SITUATIONS (pick 0-3 — what life situation does this address):
${sitList}

SERVICE CATEGORIES (pick 0-2 — what service domain):
${scList}

SKILLS (pick 0-3 — skills needed or taught):
${skillList}

TIME COMMITMENTS (pick 0-1 — how long to engage):
${timeList}

ACTION TYPES (pick 0-2 — what actions can someone take):
${actionList}

GOVERNMENT LEVELS (pick 0-1 — if accountability content, which level):
${govList}

CONTENT TYPE (pick 1 — REQUIRED): article | event | report | video | opportunity | guide | course | announcement | campaign | tool

GEOGRAPHIC SCOPE: Houston | Harris County | Texas | National | Global`
}
