/**
 * @fileoverview Deno-compatible unified classifier for Supabase edge functions.
 *
 * Mirrors src/lib/classification/index.ts but uses Deno APIs.
 * Used by: backfill-v2, sync-officials, sync-city-houston, sync-state-texas
 */

// ── Types ────────────────────────────────────────────────────────────

export type EntityType =
  | 'content' | 'organization' | 'service' | 'elected_official' | 'policy'
  | 'opportunity' | 'agency' | 'benefit_program' | 'campaign' | 'ballot_item'

export interface Taxonomy {
  themes: any[]; focusAreas: any[]; sdgs: any[]; sdoh: any[]; ntee: any[]; airs: any[]
  segments: any[]; situations: any[]; resourceTypes: any[]; serviceCats: any[]
  skills: any[]; timeCommitments: any[]; actionTypes: any[]; govLevels: any[]
}

export interface EnrichedClassification {
  theme_primary: string; theme_secondary: string[]
  focus_area_ids: string[]; sdg_ids: string[]; sdoh_code: string | null
  ntee_codes: string[]; airs_codes: string[]; center: string
  resource_type_id: string | null; audience_segment_ids: string[]
  life_situation_ids: string[]; service_cat_ids: string[]
  skill_ids: string[]; time_commitment_id: string | null
  action_type_ids: string[]; gov_level_id: string | null
  content_type: string | null; keywords: string[]
  geographic_scope: string; confidence: number; reasoning: string
  title_6th_grade?: string; summary_6th_grade?: string; impact_statement?: string
  _enriched_focus_areas: any[]; _keywords: string[]; _version: string
  [key: string]: any
}

// ── Supabase helpers ─────────────────────────────────────────────────

async function sbGet(url: string, key: string, path: string) {
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  return r.json()
}

async function sbPost(url: string, key: string, table: string, rows: any[]) {
  if (!rows.length) return
  await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  }).catch(() => {})
}

async function sbDelete(url: string, key: string, path: string) {
  await fetch(`${url}/rest/v1/${path}`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' },
  }).catch(() => {})
}

// ── Taxonomy ─────────────────────────────────────────────────────────

export async function fetchFullTaxonomy(sbUrl: string, sbKey: string): Promise<Taxonomy> {
  const get = (t: string, s = '*') => sbGet(sbUrl, sbKey, `${t}?select=${s}&limit=500`)
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
    get('time_commitments', 'time_id,time_name,min_minutes,max_minutes').catch(() => []),
    get('action_types', 'action_type_id,action_type_name,category').catch(() => []),
    get('government_levels', 'gov_level_id,gov_level_name').catch(() => []),
  ])
  return { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills, timeCommitments, actionTypes, govLevels }
}

// ── Prompt building ──────────────────────────────────────────────────

const DIMENSION_HINTS: Record<EntityType, string> = {
  content: 'This is NEWSFEED content. Identify content_type (article/event/report/video/etc). Skills 0-3, time 0-1, actions 0-2, gov 0-1.',
  organization: 'NTEE/AIRS codes are PRIMARY for orgs. Focus areas 1-5, audiences 1-3, life situations 0-3, service cats 0-3.',
  service: 'Focus on WHO this serves. Audiences 1-4, life situations 1-4, service cats 1-3 are all important.',
  elected_official: 'Government level is REQUIRED. Focus areas 1-4, audiences 1-2.',
  policy: 'Government level is REQUIRED. Write impact_statement in asset-based language. Focus areas 1-4, audiences 1-3, life situations 0-3.',
  opportunity: 'Skills 1-3 and action types 1-2 are primary. Time commitment required.',
  agency: 'Government level REQUIRED. Service categories 1-3 are primary.',
  benefit_program: 'Audiences 1-4 and life situations 1-4 are primary. Service cats 0-2.',
  campaign: 'Action types 1-2 are primary. Audiences 1-3.',
  ballot_item: 'Focus areas 1-3, audiences 1-2.',
}

export function buildPromptForEntity(tax: Taxonomy, entityType: EntityType): string {
  const thList = tax.themes.map((t: any) => `${t.theme_id}: ${t.theme_name}`).join('\n')
  const byT: Record<string, string[]> = {}
  for (const f of tax.focusAreas) { const k = f.theme_id || 'X'; if (!byT[k]) byT[k] = []; byT[k].push(`${f.focus_id}|${f.focus_area_name}|sdg:${f.sdg_id}|ntee:${f.ntee_code}|airs:${f.airs_code}|sdoh:${f.sdoh_code}${f.is_bridging ? '|BRIDGING' : ''}`) }
  let ft = ''; for (const [k, v] of Object.entries(byT)) { const n = tax.themes.find((t: any) => t.theme_id === k)?.theme_name || k; ft += `\n[${n}]\n${v.join('\n')}\n` }
  const sg = tax.segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n')
  const si = tax.situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n')
  const rt = tax.resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n')
  const sc = tax.serviceCats.map((s: any) => `${s.service_cat_id}: ${s.service_cat_name}`).join('\n')
  const sk = tax.skills.map((s: any) => `${s.skill_id}: ${s.skill_name}`).join('\n')
  const tm = (tax.timeCommitments || []).map((t: any) => `${t.time_id}: ${t.time_name}`).join('\n')
  const at = (tax.actionTypes || []).map((a: any) => `${a.action_type_id}: ${a.action_type_name}`).join('\n')
  const gv = (tax.govLevels || []).map((g: any) => `${g.gov_level_id}: ${g.gov_level_name}`).join('\n')

  const label = entityType.replace(/_/g, ' ')
  const hint = DIMENSION_HINTS[entityType] || ''

  return `Change Engine v4 classifier. Houston TX. Classifying: ${label}.
${hint}
Use ONLY valid IDs. Return JSON only. Asset-based language.

THEMES: ${thList}
FOCUS AREAS:\n${ft}
SEGMENTS: ${sg}
SITUATIONS: ${si}
RESOURCE TYPES: ${rt}
SERVICE CATS: ${sc}
SKILLS: ${sk}
${tm ? `TIME COMMITMENTS: ${tm}` : ''}
${at ? `ACTION TYPES: ${at}` : ''}
${gv ? `GOV LEVELS: ${gv}` : ''}
${entityType === 'content' ? 'CONTENT TYPE (REQUIRED): article|event|report|video|opportunity|guide|course|announcement|campaign|tool' : ''}
CENTERS: Learning|Action|Resource|Accountability
GEOGRAPHIC SCOPE: Houston|Harris County|Texas|National|Global`
}

// ── JSON parse ───────────────────────────────────────────────────────

export function parseClaudeJson(raw: string): any {
  let t = raw.trim()
  if (t.startsWith('```json')) t = t.slice(7)
  else if (t.startsWith('```')) t = t.slice(3)
  if (t.endsWith('```')) t = t.slice(0, -3)
  t = t.trim()
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  if (s === -1 || e === -1) throw new Error('No JSON found')
  return JSON.parse(t.substring(s, e + 1))
}

// ── Claude call ──────────────────────────────────────────────────────

export async function callClaude(system: string, user: string, apiKey: string, maxTokens = 2000): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      })
      const d = await r.json()
      if (d.error) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
        throw new Error(d.error.message || 'API error')
      }
      return d.content?.[0]?.text || ''
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
      throw e
    }
  }
  throw new Error('Max retries')
}

// ── Validate + Enrich ────────────────────────────────────────────────

export function validateAndEnrich(classification: any, tax: Taxonomy): EnrichedClassification {
  const validFocusIds = new Set(tax.focusAreas.map((f: any) => f.focus_id))
  const efa: any[] = []
  const iSdgs = new Set<string>(), iNtee = new Set<string>(), iAirs = new Set<string>()
  let iSdoh = ''

  for (const fid of (classification.focus_area_ids || [])) {
    if (validFocusIds.has(fid)) {
      const fa = tax.focusAreas.find((f: any) => f.focus_id === fid)
      if (fa) {
        efa.push(fa)
        if (fa.sdg_id) iSdgs.add(fa.sdg_id)
        if (fa.ntee_code) iNtee.add(fa.ntee_code)
        if (fa.airs_code) iAirs.add(fa.airs_code)
        if (fa.sdoh_code && !iSdoh) iSdoh = fa.sdoh_code
      }
    }
  }

  return {
    ...classification,
    focus_area_ids: efa.map((f: any) => f.focus_id),
    sdg_ids: [...new Set([...iSdgs, ...(classification.sdg_ids || [])])],
    ntee_codes: [...new Set([...iNtee, ...(classification.ntee_codes || [])])],
    airs_codes: [...new Set([...iAirs, ...(classification.airs_codes || [])])],
    sdoh_code: classification.sdoh_code || iSdoh || null,
    _enriched_focus_areas: efa.map((f: any) => ({ id: f.focus_id, name: f.focus_area_name, theme: f.theme_id, sdg: f.sdg_id, ntee: f.ntee_code, airs: f.airs_code, sdoh: f.sdoh_code, bridging: f.is_bridging })),
    _keywords: classification.keywords || [],
    _version: 'v4-unified',
  }
}

// ── Junction table population ────────────────────────────────────────

const JUNCTIONS: Record<EntityType, { idCol: string; focus: string; sdgs: string; audiences: string; situations: string; serviceCats: string; pathways: string; actionTypes?: string }> = {
  content: { idCol: 'content_id', focus: 'content_focus_areas', sdgs: 'content_sdgs', audiences: 'content_audience_segments', situations: 'content_life_situations', serviceCats: 'content_service_categories', pathways: 'content_pathways' },
  organization: { idCol: 'org_id', focus: 'organization_focus_areas', sdgs: 'organization_sdgs', audiences: 'organization_audience_segments', situations: 'organization_life_situations', serviceCats: 'organization_service_categories', pathways: 'organization_pathways' },
  service: { idCol: 'service_id', focus: 'service_focus_areas', sdgs: 'service_sdgs', audiences: 'service_audience_segments', situations: 'service_life_situations', serviceCats: '', pathways: 'service_pathways' },
  elected_official: { idCol: 'official_id', focus: 'official_focus_areas', sdgs: 'official_sdgs', audiences: 'official_audience_segments', situations: '', serviceCats: '', pathways: 'official_pathways' },
  policy: { idCol: 'policy_id', focus: 'policy_focus_areas', sdgs: 'policy_sdgs', audiences: 'policy_audience_segments', situations: 'policy_life_situations', serviceCats: '', pathways: 'policy_pathways' },
  opportunity: { idCol: 'opportunity_id', focus: 'opportunity_focus_areas', sdgs: 'opportunity_sdgs', audiences: 'opportunity_audience_segments', situations: 'opportunity_life_situations', serviceCats: '', pathways: 'opportunity_pathways', actionTypes: 'opportunity_action_types' },
  agency: { idCol: 'agency_id', focus: 'agency_focus_areas', sdgs: 'agency_sdgs', audiences: 'agency_audience_segments', situations: '', serviceCats: 'agency_service_categories', pathways: 'agency_pathways' },
  benefit_program: { idCol: 'benefit_id', focus: 'benefit_focus_areas', sdgs: 'benefit_sdgs', audiences: 'benefit_audience_segments', situations: 'benefit_life_situations', serviceCats: 'benefit_service_categories', pathways: 'benefit_pathways' },
  campaign: { idCol: 'campaign_id', focus: 'campaign_focus_areas', sdgs: 'campaign_sdgs', audiences: 'campaign_audience_segments', situations: '', serviceCats: '', pathways: 'campaign_pathways' },
  ballot_item: { idCol: 'item_id', focus: 'ballot_item_focus_areas', sdgs: 'ballot_item_sdgs', audiences: 'ballot_item_audience_segments', situations: '', serviceCats: '', pathways: 'ballot_item_pathways' },
}

export async function populateAllJunctions(entityType: EntityType, entityId: string, c: EnrichedClassification, sbUrl: string, sbKey: string) {
  const j = JUNCTIONS[entityType]
  if (!j) return
  const id = j.idCol

  // Delete existing
  const tables = [j.focus, j.sdgs, j.audiences, j.situations, j.serviceCats, j.pathways, j.actionTypes].filter(Boolean)
  await Promise.allSettled(tables.map(t => sbDelete(sbUrl, sbKey, `${t}?${id}=eq.${entityId}`)))

  // Pathway rows
  const pw: any[] = []
  if (c.theme_primary) pw.push({ [id]: entityId, theme_id: c.theme_primary, is_primary: true })
  for (const t of (c.theme_secondary || [])) pw.push({ [id]: entityId, theme_id: t, is_primary: false })

  await Promise.allSettled([
    sbPost(sbUrl, sbKey, j.focus, (c.focus_area_ids || []).map(fid => ({ [id]: entityId, focus_id: fid }))),
    sbPost(sbUrl, sbKey, j.sdgs, (c.sdg_ids || []).map(sid => ({ [id]: entityId, sdg_id: sid }))),
    sbPost(sbUrl, sbKey, j.audiences, (c.audience_segment_ids || []).map(aid => ({ [id]: entityId, segment_id: aid }))),
    j.situations ? sbPost(sbUrl, sbKey, j.situations, (c.life_situation_ids || []).map(lid => ({ [id]: entityId, situation_id: lid }))) : Promise.resolve(),
    j.serviceCats ? sbPost(sbUrl, sbKey, j.serviceCats, (c.service_cat_ids || []).map(scid => ({ [id]: entityId, service_cat_id: scid }))) : Promise.resolve(),
    sbPost(sbUrl, sbKey, j.pathways, pw),
    j.actionTypes ? sbPost(sbUrl, sbKey, j.actionTypes, (c.action_type_ids || []).map(atid => ({ [id]: entityId, action_type_id: atid }))) : Promise.resolve(),
  ])
}

// ── Table configs ────────────────────────────────────────────────────

export const TABLE_CONFIGS: Record<string, { pk: string; nm: string; desc: string; extra: string[]; entityType: EntityType }> = {
  organizations: { pk: 'org_id', nm: 'org_name', desc: 'description_5th_grade', extra: ['mission_statement', 'website'], entityType: 'organization' },
  services_211: { pk: 'service_id', nm: 'service_name', desc: 'description_5th_grade', extra: ['org_id'], entityType: 'service' },
  policies: { pk: 'policy_id', nm: 'policy_name', desc: 'summary_5th_grade', extra: ['policy_type', 'level', 'status', 'bill_number'], entityType: 'policy' },
  opportunities: { pk: 'opportunity_id', nm: 'opportunity_name', desc: 'description_5th_grade', extra: ['org_id'], entityType: 'opportunity' },
  elected_officials: { pk: 'official_id', nm: 'official_name', desc: 'description_5th_grade', extra: ['title', 'level', 'party'], entityType: 'elected_official' },
  agencies: { pk: 'agency_id', nm: 'agency_name', desc: 'description_5th_grade', extra: ['website', 'level', 'jurisdiction'], entityType: 'agency' },
  benefit_programs: { pk: 'benefit_id', nm: 'benefit_name', desc: 'description_5th_grade', extra: ['eligibility', 'application_url', 'agency_id'], entityType: 'benefit_program' },
  campaigns: { pk: 'campaign_id', nm: 'campaign_name', desc: 'description_5th_grade', extra: ['org_id'], entityType: 'campaign' },
  ballot_items: { pk: 'item_id', nm: 'item_name', desc: 'description_5th_grade', extra: ['election_id', 'item_type', 'jurisdiction'], entityType: 'ballot_item' },
}
