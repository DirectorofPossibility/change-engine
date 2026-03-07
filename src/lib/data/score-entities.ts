/**
 * @fileoverview Core entity completeness scoring logic.
 *
 * Extracted from the API route so it can be called directly from server actions
 * (avoiding self-fetch issues on Vercel) as well as from the API route for
 * external/cron access.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Supabase REST helper ──────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (method === 'POST') headers['Prefer'] = extraHeaders?.['Prefer'] || 'return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Field weight configs per entity type ──────────────────────────────

interface FieldDef {
  fields: string[]       // OR-group: at least one filled counts
  category: 'CRITICAL' | 'IMPORTANT' | 'NICE'
  weight: number
  label: string          // human-readable name for missing-fields report
  checkType?: 'json' | 'array' | 'string'
}

export const ENTITY_CONFIGS: Record<string, {
  table: string
  idCol: string
  nameCol: string
  selectCols: string
  fields: FieldDef[]
}> = {
  organization: {
    table: 'organizations',
    idCol: 'org_id',
    nameCol: 'org_name',
    selectCols: 'org_id,org_name,description_5th_grade,logo_url,phone,email,website,address,city,state,zip_code,mission_statement,social_media,focus_area_ids,hero_image_url,hours_of_operation,annual_budget,year_founded,tags,service_area,app_store_url,google_play_url,org_type,theme_id,summary_6th_grade',
    fields: [
      { fields: ['org_name'], category: 'CRITICAL', weight: 3, label: 'org_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['logo_url'], category: 'CRITICAL', weight: 3, label: 'logo_url' },
      { fields: ['phone', 'email'], category: 'CRITICAL', weight: 3, label: 'phone/email' },
      { fields: ['website'], category: 'IMPORTANT', weight: 2, label: 'website' },
      { fields: ['address'], category: 'IMPORTANT', weight: 2, label: 'address' },
      { fields: ['mission_statement'], category: 'IMPORTANT', weight: 2, label: 'mission_statement' },
      { fields: ['social_media'], category: 'IMPORTANT', weight: 2, label: 'social_media', checkType: 'json' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['org_type'], category: 'IMPORTANT', weight: 2, label: 'org_type' },
      { fields: ['theme_id'], category: 'IMPORTANT', weight: 2, label: 'theme_id' },
      { fields: ['hero_image_url'], category: 'NICE', weight: 1, label: 'hero_image_url' },
      { fields: ['hours_of_operation'], category: 'NICE', weight: 1, label: 'hours_of_operation' },
      { fields: ['annual_budget'], category: 'NICE', weight: 1, label: 'annual_budget' },
      { fields: ['year_founded'], category: 'NICE', weight: 1, label: 'year_founded' },
      { fields: ['tags'], category: 'NICE', weight: 1, label: 'tags', checkType: 'array' },
      { fields: ['service_area'], category: 'NICE', weight: 1, label: 'service_area' },
      { fields: ['app_store_url', 'google_play_url'], category: 'NICE', weight: 1, label: 'app_store_url/google_play_url' },
    ],
  },
  official: {
    table: 'elected_officials',
    idCol: 'official_id',
    nameCol: 'official_name',
    selectCols: 'official_id,official_name,description_5th_grade,photo_url,email,title,party,website,level,jurisdiction,office_phone,focus_area_ids,term_end,counties_served,bio,social_media,address,office_address',
    fields: [
      { fields: ['official_name'], category: 'CRITICAL', weight: 3, label: 'official_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['photo_url'], category: 'CRITICAL', weight: 3, label: 'photo_url' },
      { fields: ['email'], category: 'CRITICAL', weight: 3, label: 'email' },
      { fields: ['title'], category: 'IMPORTANT', weight: 2, label: 'title' },
      { fields: ['party'], category: 'IMPORTANT', weight: 2, label: 'party' },
      { fields: ['website'], category: 'IMPORTANT', weight: 2, label: 'website' },
      { fields: ['level'], category: 'IMPORTANT', weight: 2, label: 'level' },
      { fields: ['jurisdiction'], category: 'IMPORTANT', weight: 2, label: 'jurisdiction' },
      { fields: ['office_phone'], category: 'IMPORTANT', weight: 2, label: 'office_phone' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['social_media'], category: 'IMPORTANT', weight: 2, label: 'social_media', checkType: 'json' },
      { fields: ['term_end'], category: 'NICE', weight: 1, label: 'term_end' },
      { fields: ['counties_served'], category: 'NICE', weight: 1, label: 'counties_served' },
      { fields: ['bio'], category: 'NICE', weight: 1, label: 'bio' },
      { fields: ['address', 'office_address'], category: 'NICE', weight: 1, label: 'address/office_address' },
    ],
  },
  content: {
    table: 'content_published',
    idCol: 'id',
    nameCol: 'title_6th_grade',
    selectCols: 'id,title_6th_grade,summary_6th_grade,image_url,source_url,pathway_primary,center,focus_area_ids,org_id,engagement_level,audience_segments,sdg_ids,sdoh_domain,life_situations,geographic_scope,resource_type,content_type,keywords,video_url,body',
    fields: [
      { fields: ['title_6th_grade'], category: 'CRITICAL', weight: 3, label: 'title_6th_grade' },
      { fields: ['summary_6th_grade'], category: 'CRITICAL', weight: 3, label: 'summary_6th_grade' },
      { fields: ['image_url'], category: 'CRITICAL', weight: 3, label: 'image_url' },
      { fields: ['source_url'], category: 'CRITICAL', weight: 3, label: 'source_url' },
      { fields: ['pathway_primary'], category: 'IMPORTANT', weight: 2, label: 'pathway_primary' },
      { fields: ['center'], category: 'IMPORTANT', weight: 2, label: 'center' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['org_id'], category: 'IMPORTANT', weight: 2, label: 'org_id' },
      { fields: ['engagement_level'], category: 'IMPORTANT', weight: 2, label: 'engagement_level' },
      { fields: ['content_type'], category: 'IMPORTANT', weight: 2, label: 'content_type' },
      { fields: ['audience_segments'], category: 'NICE', weight: 1, label: 'audience_segments' },
      { fields: ['sdg_ids'], category: 'NICE', weight: 1, label: 'sdg_ids' },
      { fields: ['sdoh_domain'], category: 'NICE', weight: 1, label: 'sdoh_domain' },
      { fields: ['life_situations'], category: 'NICE', weight: 1, label: 'life_situations' },
      { fields: ['geographic_scope'], category: 'NICE', weight: 1, label: 'geographic_scope' },
      { fields: ['resource_type'], category: 'NICE', weight: 1, label: 'resource_type' },
      { fields: ['keywords'], category: 'NICE', weight: 1, label: 'keywords' },
    ],
  },
  service: {
    table: 'services_211',
    idCol: 'service_id',
    nameCol: 'service_name',
    selectCols: 'service_id,service_name,description_5th_grade,phone,org_id,website,address,city,state,zip_code,service_cat_id,focus_area_ids,eligibility,hours,fees,languages,airs_code,engagement_level',
    fields: [
      { fields: ['service_name'], category: 'CRITICAL', weight: 3, label: 'service_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['phone'], category: 'CRITICAL', weight: 3, label: 'phone' },
      { fields: ['org_id'], category: 'CRITICAL', weight: 3, label: 'org_id' },
      { fields: ['website'], category: 'IMPORTANT', weight: 2, label: 'website' },
      { fields: ['address'], category: 'IMPORTANT', weight: 2, label: 'address' },
      { fields: ['service_cat_id'], category: 'IMPORTANT', weight: 2, label: 'service_cat_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['eligibility'], category: 'IMPORTANT', weight: 2, label: 'eligibility' },
      { fields: ['engagement_level'], category: 'IMPORTANT', weight: 2, label: 'engagement_level' },
      { fields: ['hours'], category: 'NICE', weight: 1, label: 'hours' },
      { fields: ['fees'], category: 'NICE', weight: 1, label: 'fees' },
      { fields: ['languages'], category: 'NICE', weight: 1, label: 'languages' },
      { fields: ['airs_code'], category: 'NICE', weight: 1, label: 'airs_code' },
    ],
  },
  resource: {
    table: 'resources',
    idCol: 'resource_id',
    nameCol: 'resource_name',
    selectCols: 'resource_id,resource_name,description_5th_grade,source_url,image_url,resource_type_id,focus_area_ids,source_org,content_format,path_ids,estimated_minutes,reading_level,language_ids',
    fields: [
      { fields: ['resource_name'], category: 'CRITICAL', weight: 3, label: 'resource_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['source_url'], category: 'CRITICAL', weight: 3, label: 'source_url' },
      { fields: ['image_url'], category: 'CRITICAL', weight: 3, label: 'image_url' },
      { fields: ['resource_type_id'], category: 'IMPORTANT', weight: 2, label: 'resource_type_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['source_org'], category: 'IMPORTANT', weight: 2, label: 'source_org' },
      { fields: ['content_format'], category: 'IMPORTANT', weight: 2, label: 'content_format' },
      { fields: ['path_ids'], category: 'NICE', weight: 1, label: 'path_ids' },
      { fields: ['estimated_minutes'], category: 'NICE', weight: 1, label: 'estimated_minutes' },
      { fields: ['reading_level'], category: 'NICE', weight: 1, label: 'reading_level' },
      { fields: ['language_ids'], category: 'NICE', weight: 1, label: 'language_ids' },
    ],
  },
  life_situation: {
    table: 'life_situations',
    idCol: 'situation_id',
    nameCol: 'situation_name',
    selectCols: 'situation_id,situation_name,description_5th_grade,theme_id,focus_area_ids,icon_name,color,urgency_level,situation_slug,service_cat_ids,resource_ids,agency_ids,benefit_ids,display_order,engagement_level',
    fields: [
      { fields: ['situation_name'], category: 'CRITICAL', weight: 3, label: 'situation_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['theme_id'], category: 'CRITICAL', weight: 3, label: 'theme_id' },
      { fields: ['focus_area_ids'], category: 'CRITICAL', weight: 3, label: 'focus_area_ids' },
      { fields: ['icon_name'], category: 'IMPORTANT', weight: 2, label: 'icon_name' },
      { fields: ['color'], category: 'IMPORTANT', weight: 2, label: 'color' },
      { fields: ['urgency_level'], category: 'IMPORTANT', weight: 2, label: 'urgency_level' },
      { fields: ['situation_slug'], category: 'IMPORTANT', weight: 2, label: 'situation_slug' },
      { fields: ['service_cat_ids'], category: 'IMPORTANT', weight: 2, label: 'service_cat_ids' },
      { fields: ['resource_ids'], category: 'NICE', weight: 1, label: 'resource_ids' },
      { fields: ['agency_ids'], category: 'NICE', weight: 1, label: 'agency_ids' },
      { fields: ['benefit_ids'], category: 'NICE', weight: 1, label: 'benefit_ids' },
      { fields: ['display_order'], category: 'NICE', weight: 1, label: 'display_order' },
    ],
  },
  agency: {
    table: 'agencies',
    idCol: 'agency_id',
    nameCol: 'agency_name',
    selectCols: 'agency_id,agency_name,agency_acronym,description_5th_grade,jurisdiction,focus_area_ids,address,city,state,zip_code,phone,website,engagement_level',
    fields: [
      { fields: ['agency_name'], category: 'CRITICAL', weight: 3, label: 'agency_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['jurisdiction'], category: 'CRITICAL', weight: 3, label: 'jurisdiction' },
      { fields: ['phone', 'website'], category: 'CRITICAL', weight: 3, label: 'phone/website' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['address'], category: 'IMPORTANT', weight: 2, label: 'address' },
      { fields: ['engagement_level'], category: 'IMPORTANT', weight: 2, label: 'engagement_level' },
      { fields: ['agency_acronym'], category: 'NICE', weight: 1, label: 'agency_acronym' },
    ],
  },
  benefit: {
    table: 'benefit_programs',
    idCol: 'benefit_id',
    nameCol: 'benefit_name',
    selectCols: 'benefit_id,benefit_name,description_5th_grade,benefit_type,focus_area_ids,eligibility_summary,income_limit_description,application_url,application_method,processing_days,benefit_amount,renewal_frequency,documentation_needed,engagement_level',
    fields: [
      { fields: ['benefit_name'], category: 'CRITICAL', weight: 3, label: 'benefit_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['benefit_type'], category: 'CRITICAL', weight: 3, label: 'benefit_type' },
      { fields: ['eligibility_summary'], category: 'CRITICAL', weight: 3, label: 'eligibility_summary' },
      { fields: ['application_url', 'application_method'], category: 'IMPORTANT', weight: 2, label: 'application_url/method' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['benefit_amount'], category: 'IMPORTANT', weight: 2, label: 'benefit_amount' },
      { fields: ['income_limit_description'], category: 'IMPORTANT', weight: 2, label: 'income_limit_description' },
      { fields: ['documentation_needed'], category: 'NICE', weight: 1, label: 'documentation_needed' },
      { fields: ['processing_days'], category: 'NICE', weight: 1, label: 'processing_days' },
      { fields: ['renewal_frequency'], category: 'NICE', weight: 1, label: 'renewal_frequency' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  campaign: {
    table: 'campaigns',
    idCol: 'campaign_id',
    nameCol: 'campaign_name',
    selectCols: 'campaign_id,campaign_name,description_5th_grade,campaign_type,theme_id,focus_area_ids,goal_description,target_value,current_value,org_id,status,start_date,end_date,participant_count,engagement_level',
    fields: [
      { fields: ['campaign_name'], category: 'CRITICAL', weight: 3, label: 'campaign_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['campaign_type'], category: 'CRITICAL', weight: 3, label: 'campaign_type' },
      { fields: ['goal_description'], category: 'CRITICAL', weight: 3, label: 'goal_description' },
      { fields: ['org_id'], category: 'IMPORTANT', weight: 2, label: 'org_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['theme_id'], category: 'IMPORTANT', weight: 2, label: 'theme_id' },
      { fields: ['status'], category: 'IMPORTANT', weight: 2, label: 'status' },
      { fields: ['start_date'], category: 'IMPORTANT', weight: 2, label: 'start_date' },
      { fields: ['target_value'], category: 'NICE', weight: 1, label: 'target_value' },
      { fields: ['participant_count'], category: 'NICE', weight: 1, label: 'participant_count' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  event: {
    table: 'events',
    idCol: 'event_id',
    nameCol: 'event_name',
    selectCols: 'event_id,event_name,description_5th_grade,org_id,focus_area_ids,event_type,address,city,state,zip_code,is_virtual,start_datetime,end_datetime,registration_url,cost,is_free,engagement_level',
    fields: [
      { fields: ['event_name'], category: 'CRITICAL', weight: 3, label: 'event_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['start_datetime'], category: 'CRITICAL', weight: 3, label: 'start_datetime' },
      { fields: ['org_id'], category: 'IMPORTANT', weight: 2, label: 'org_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['event_type'], category: 'IMPORTANT', weight: 2, label: 'event_type' },
      { fields: ['address', 'is_virtual'], category: 'IMPORTANT', weight: 2, label: 'address/is_virtual' },
      { fields: ['registration_url'], category: 'IMPORTANT', weight: 2, label: 'registration_url' },
      { fields: ['end_datetime'], category: 'NICE', weight: 1, label: 'end_datetime' },
      { fields: ['cost', 'is_free'], category: 'NICE', weight: 1, label: 'cost/is_free' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  foundation: {
    table: 'foundations',
    idCol: 'id',
    nameCol: 'name',
    selectCols: 'id,name,mission,website_url,type,geo_level,assets,annual_giving,founded_year,address,city,state_code,zip_code,phone,email',
    fields: [
      { fields: ['name'], category: 'CRITICAL', weight: 3, label: 'name' },
      { fields: ['mission'], category: 'CRITICAL', weight: 3, label: 'mission' },
      { fields: ['type'], category: 'CRITICAL', weight: 3, label: 'type' },
      { fields: ['website_url'], category: 'IMPORTANT', weight: 2, label: 'website_url' },
      { fields: ['geo_level'], category: 'IMPORTANT', weight: 2, label: 'geo_level' },
      { fields: ['phone', 'email'], category: 'IMPORTANT', weight: 2, label: 'phone/email' },
      { fields: ['address'], category: 'IMPORTANT', weight: 2, label: 'address' },
      { fields: ['assets'], category: 'NICE', weight: 1, label: 'assets' },
      { fields: ['annual_giving'], category: 'NICE', weight: 1, label: 'annual_giving' },
      { fields: ['founded_year'], category: 'NICE', weight: 1, label: 'founded_year' },
    ],
  },
  opportunity: {
    table: 'opportunities',
    idCol: 'opportunity_id',
    nameCol: 'opportunity_name',
    selectCols: 'opportunity_id,opportunity_name,description_5th_grade,org_id,focus_area_ids,action_type_id,time_commitment_id,skill_ids,address,city,state,zip_code,is_virtual,start_date,end_date,registration_url,engagement_level',
    fields: [
      { fields: ['opportunity_name'], category: 'CRITICAL', weight: 3, label: 'opportunity_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['org_id'], category: 'CRITICAL', weight: 3, label: 'org_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['action_type_id'], category: 'IMPORTANT', weight: 2, label: 'action_type_id' },
      { fields: ['time_commitment_id'], category: 'IMPORTANT', weight: 2, label: 'time_commitment_id' },
      { fields: ['address', 'is_virtual'], category: 'IMPORTANT', weight: 2, label: 'address/is_virtual' },
      { fields: ['registration_url'], category: 'IMPORTANT', weight: 2, label: 'registration_url' },
      { fields: ['skill_ids'], category: 'NICE', weight: 1, label: 'skill_ids' },
      { fields: ['start_date'], category: 'NICE', weight: 1, label: 'start_date' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  policy: {
    table: 'policies',
    idCol: 'policy_id',
    nameCol: 'policy_name',
    selectCols: 'policy_id,policy_name,policy_type,level,status,summary_5th_grade,focus_area_ids,official_ids,bill_number,source_url,engagement_level,title_6th_grade,summary_6th_grade,impact_statement',
    fields: [
      { fields: ['policy_name'], category: 'CRITICAL', weight: 3, label: 'policy_name' },
      { fields: ['summary_5th_grade', 'summary_6th_grade'], category: 'CRITICAL', weight: 3, label: 'summary' },
      { fields: ['policy_type'], category: 'CRITICAL', weight: 3, label: 'policy_type' },
      { fields: ['level'], category: 'CRITICAL', weight: 3, label: 'level' },
      { fields: ['status'], category: 'IMPORTANT', weight: 2, label: 'status' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['official_ids'], category: 'IMPORTANT', weight: 2, label: 'official_ids' },
      { fields: ['source_url'], category: 'IMPORTANT', weight: 2, label: 'source_url' },
      { fields: ['bill_number'], category: 'IMPORTANT', weight: 2, label: 'bill_number' },
      { fields: ['impact_statement'], category: 'NICE', weight: 1, label: 'impact_statement' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  guide: {
    table: 'guides',
    idCol: 'guide_id',
    nameCol: 'title',
    selectCols: 'guide_id,title,slug,description,hero_image_url,content_html,sections,theme_id,focus_area_ids,engagement_level,org_id',
    fields: [
      { fields: ['title'], category: 'CRITICAL', weight: 3, label: 'title' },
      { fields: ['description'], category: 'CRITICAL', weight: 3, label: 'description' },
      { fields: ['content_html', 'sections'], category: 'CRITICAL', weight: 3, label: 'content_html/sections' },
      { fields: ['slug'], category: 'IMPORTANT', weight: 2, label: 'slug' },
      { fields: ['theme_id'], category: 'IMPORTANT', weight: 2, label: 'theme_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['hero_image_url'], category: 'IMPORTANT', weight: 2, label: 'hero_image_url' },
      { fields: ['org_id'], category: 'NICE', weight: 1, label: 'org_id' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  learning_path: {
    table: 'learning_paths',
    idCol: 'path_id',
    nameCol: 'path_name',
    selectCols: 'path_id,path_name,path_description,description_5th_grade,theme_id,focus_area_ids,difficulty_level,estimated_minutes,module_count,slug,engagement_level',
    fields: [
      { fields: ['path_name'], category: 'CRITICAL', weight: 3, label: 'path_name' },
      { fields: ['description_5th_grade', 'path_description'], category: 'CRITICAL', weight: 3, label: 'description' },
      { fields: ['theme_id'], category: 'CRITICAL', weight: 3, label: 'theme_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['difficulty_level'], category: 'IMPORTANT', weight: 2, label: 'difficulty_level' },
      { fields: ['estimated_minutes'], category: 'IMPORTANT', weight: 2, label: 'estimated_minutes' },
      { fields: ['module_count'], category: 'IMPORTANT', weight: 2, label: 'module_count' },
      { fields: ['slug'], category: 'NICE', weight: 1, label: 'slug' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  ballot_item: {
    table: 'ballot_items',
    idCol: 'item_id',
    nameCol: 'item_name',
    selectCols: 'item_id,item_name,item_type,jurisdiction,description,description_5th_grade,focus_area_ids,for_argument,against_argument,fiscal_impact,election_id,election_date,community_impact_summary,engagement_level',
    fields: [
      { fields: ['item_name'], category: 'CRITICAL', weight: 3, label: 'item_name' },
      { fields: ['description_5th_grade', 'description'], category: 'CRITICAL', weight: 3, label: 'description' },
      { fields: ['item_type'], category: 'CRITICAL', weight: 3, label: 'item_type' },
      { fields: ['jurisdiction'], category: 'CRITICAL', weight: 3, label: 'jurisdiction' },
      { fields: ['election_id'], category: 'IMPORTANT', weight: 2, label: 'election_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['for_argument'], category: 'IMPORTANT', weight: 2, label: 'for_argument' },
      { fields: ['against_argument'], category: 'IMPORTANT', weight: 2, label: 'against_argument' },
      { fields: ['fiscal_impact'], category: 'NICE', weight: 1, label: 'fiscal_impact' },
      { fields: ['community_impact_summary'], category: 'NICE', weight: 1, label: 'community_impact_summary' },
      { fields: ['engagement_level'], category: 'NICE', weight: 1, label: 'engagement_level' },
    ],
  },
  kb_document: {
    table: 'kb_documents',
    idCol: 'id',
    nameCol: 'title',
    selectCols: 'id,title,summary,key_points,file_path,tags,theme_ids,focus_area_ids,org_id,content_type',
    fields: [
      { fields: ['title'], category: 'CRITICAL', weight: 3, label: 'title' },
      { fields: ['summary'], category: 'CRITICAL', weight: 3, label: 'summary' },
      { fields: ['file_path'], category: 'CRITICAL', weight: 3, label: 'file_path' },
      { fields: ['key_points'], category: 'IMPORTANT', weight: 2, label: 'key_points' },
      { fields: ['focus_area_ids', 'focus_area_ids_v2'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['theme_ids', 'theme_id'], category: 'IMPORTANT', weight: 2, label: 'theme_ids' },
      { fields: ['org_id'], category: 'IMPORTANT', weight: 2, label: 'org_id' },
      { fields: ['tags'], category: 'NICE', weight: 1, label: 'tags' },
      { fields: ['content_type'], category: 'NICE', weight: 1, label: 'content_type' },
    ],
  },
}

// ── Field checking ────────────────────────────────────────────────────

function isFieldFilled(value: unknown, checkType?: string): boolean {
  if (value === null || value === undefined) return false

  if (checkType === 'json') {
    let parsed: unknown = value
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed) } catch { return false }
    }
    if (typeof parsed !== 'object' || parsed === null) return false
    return Object.keys(parsed).length > 0
  }

  if (checkType === 'array') {
    if (typeof value === 'string') {
      if (value.startsWith('[')) {
        try {
          const arr = JSON.parse(value)
          return Array.isArray(arr) && arr.length > 0
        } catch {
          return value.trim().length > 0
        }
      }
      return value.trim().length > 0
    }
    if (Array.isArray(value)) return value.length > 0
    return false
  }

  // Default: string check
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return true
  if (Array.isArray(value)) return value.length > 0
  return true
}

function scoreEntity(row: Record<string, unknown>, config: typeof ENTITY_CONFIGS[string]) {
  const fieldScores: Record<string, { weight: number; filled: boolean; category: string }> = {}
  const missingFields: string[] = []
  const criticalMissing: string[] = []
  let totalWeight = 0
  let filledWeight = 0
  let totalFields = 0
  let filledFields = 0

  for (const fieldDef of config.fields) {
    const filled = fieldDef.fields.some(f => isFieldFilled(row[f], fieldDef.checkType))
    fieldScores[fieldDef.label] = { weight: fieldDef.weight, filled, category: fieldDef.category }
    totalWeight += fieldDef.weight
    totalFields++
    if (filled) {
      filledWeight += fieldDef.weight
      filledFields++
    } else {
      missingFields.push(fieldDef.label)
      if (fieldDef.category === 'CRITICAL') {
        criticalMissing.push(fieldDef.label)
      }
    }
  }

  const score = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0
  let tier: string
  if (score >= 95) tier = 'platinum'
  else if (score >= 80) tier = 'gold'
  else if (score >= 50) tier = 'silver'
  else tier = 'bronze'

  return {
    completeness_score: score,
    completeness_tier: tier,
    total_fields: totalFields,
    filled_fields: filledFields,
    missing_fields: missingFields,
    critical_missing: criticalMissing,
    field_scores: fieldScores,
  }
}

// ── Score all entities of a given type ─────────────────────────────────

async function scoreEntityType(entityType: string): Promise<{ scored: number; errors: number }> {
  const config = ENTITY_CONFIGS[entityType]
  if (!config) throw new Error(`Unknown entity type: ${entityType}`)

  // Fetch all rows (paginated in batches of 1000)
  let allRows: Record<string, unknown>[] = []
  let offset = 0
  const batchSize = 1000

  while (true) {
    const rows = await supaRest('GET',
      `${config.table}?select=${config.selectCols}&limit=${batchSize}&offset=${offset}&order=${config.idCol}.asc`
    )
    if (!rows || rows.length === 0) break
    allRows = allRows.concat(rows)
    if (rows.length < batchSize) break
    offset += batchSize
  }

  if (allRows.length === 0) return { scored: 0, errors: 0 }

  // Score each entity
  const upsertBatch: Record<string, unknown>[] = []
  let errors = 0

  for (const row of allRows) {
    try {
      const entityId = String(row[config.idCol])
      const entityName = String(row[config.nameCol] || '')
      const scores = scoreEntity(row as Record<string, unknown>, config)

      upsertBatch.push({
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        ...scores,
        scored_at: new Date().toISOString(),
      })
    } catch {
      errors++
    }
  }

  // Batch upsert via PostgREST (chunks of 500)
  const chunkSize = 500
  for (let i = 0; i < upsertBatch.length; i += chunkSize) {
    const chunk = upsertBatch.slice(i, i + chunkSize)
    await supaRest('POST', 'entity_completeness', chunk, {
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    })
  }

  return { scored: upsertBatch.length, errors }
}

// ── Public API ────────────────────────────────────────────────────────

export interface ScoreResult {
  totalScored: number
  totalErrors: number
  results: Record<string, { scored: number; errors: number }>
}

/**
 * Score entities for completeness. Can score a single type or all types.
 * Called directly by the server action and by the API route.
 */
export async function runEntityScoring(entityType?: string): Promise<ScoreResult> {
  const typesToScore = entityType
    ? [entityType]
    : Object.keys(ENTITY_CONFIGS)

  const results: Record<string, { scored: number; errors: number }> = {}
  let totalScored = 0
  let totalErrors = 0

  for (const type of typesToScore) {
    if (!ENTITY_CONFIGS[type]) {
      results[type] = { scored: 0, errors: 1 }
      totalErrors++
      continue
    }
    try {
      const result = await scoreEntityType(type)
      results[type] = result
      totalScored += result.scored
      totalErrors += result.errors
    } catch (err) {
      results[type] = { scored: 0, errors: 1 }
      totalErrors++
      console.error(`Error scoring ${type}:`, err)
    }
  }

  return { totalScored, totalErrors, results }
}
