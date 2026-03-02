import { createClient } from '@/lib/supabase/server'

// ── Types ──

export interface CircleResource {
  id: string
  title: string
  center: string
  summary: string
  org: string
  desc: string
  source_url: string | null
  engagement_level: string | null
}

export interface CircleOfficial {
  id: string
  name: string
  role: string
  level: string
  jur: string
  rel: string
  note: string
  phone: string
  website: string | null
}

export interface CirclePolicy {
  id: string
  name: string
  status: string
  body: string
  level: string
  rel: string
  desc: string
  plain: string
  source_url: string | null
}

export interface CirclePathway {
  id: number
  key: string
  name: string
  color: string
  sub: string
  count: number
  topics: string[]
  resources: CircleResource[]
  officials: CircleOfficial[]
  policies: CirclePolicy[]
  isCenter?: boolean
}

export interface CircleData {
  pathways: CirclePathway[]
  bridges: [number, number, number, string][]
  stats: { resources: number; officials: number; policies: number; focusAreas: number }
  officialsHome: { name: string; title: string; level: string; since: string }[]
  engagementLevels: string[]
}

// ── Pathway config (editorial — colors, names, subtitles) ──

const PATHWAY_CONFIG: Array<{
  key: string; name: string; color: string; sub: string; isCenter?: boolean
}> = [
  { key: 'THEME_01', name: 'Health', color: '#D4654A', sub: 'Wellness, healing, and care' },
  { key: 'THEME_02', name: 'Families', color: '#C4943C', sub: 'Education, safety, strong foundations' },
  { key: 'THEME_03', name: 'Neighborhood', color: '#7B6BA8', sub: 'Housing, safety, places we share' },
  { key: 'THEME_04', name: 'Voice', color: '#3D7A7A', sub: 'Civic power, voting, participation' },
  { key: 'THEME_05', name: 'Money', color: '#4A7A8A', sub: 'Jobs, financial health, opportunity' },
  { key: 'THEME_06', name: 'Planet', color: '#5A8E5A', sub: 'Climate, environment, sustainability' },
  { key: 'THEME_07', name: 'The Bigger We', color: '#8B6BA8', sub: 'Bridging difference, building together', isCenter: true },
]

// Map DB center "Accountability" to circle's "Responsible"
function mapCenter(center: string | null): string {
  if (center === 'Accountability') return 'Responsible'
  return center || 'Learning'
}

// ── Main data fetcher ──

export async function getCircleData(): Promise<CircleData> {
  const supabase = await createClient()

  // Fetch everything in parallel
  const [
    { data: content },
    { data: focusAreas },
    { data: officials },
    { data: policies },
    { data: orgs },
  ] = await Promise.all([
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, center, pathway_primary, pathway_secondary, source_url, source_domain, org_id, confidence, engagement_level')
      .eq('is_active', true)
      .order('published_at', { ascending: false }),
    supabase
      .from('focus_areas')
      .select('focus_id, focus_area_name, theme_id'),
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title, level, jurisdiction, description_5th_grade, office_phone, website, focus_area_ids, term_end'),
    supabase
      .from('policies')
      .select('policy_id, policy_name, status, level, policy_type, summary_5th_grade, focus_area_ids, source_url, bill_number, last_action_date')
      .order('last_action_date', { ascending: false }),
    supabase
      .from('organizations')
      .select('org_id, org_name'),
  ])

  // Build lookup maps
  const orgMap = new Map<string, string>()
  orgs?.forEach(o => orgMap.set(o.org_id, o.org_name))

  // Focus area → theme mapping
  const focusToTheme = new Map<string, string>()
  const themeFocusAreas = new Map<string, string[]>()
  focusAreas?.forEach(fa => {
    if (fa.theme_id) {
      focusToTheme.set(fa.focus_id, fa.theme_id)
      const existing = themeFocusAreas.get(fa.theme_id) || []
      existing.push(fa.focus_area_name)
      themeFocusAreas.set(fa.theme_id, existing)
    }
  })

  // Group content by pathway_primary
  const contentByTheme = new Map<string, typeof content>()
  content?.forEach(c => {
    if (c.pathway_primary) {
      const existing = contentByTheme.get(c.pathway_primary) || []
      existing.push(c)
      contentByTheme.set(c.pathway_primary, existing)
    }
  })

  // Map officials to themes via focus_area_ids overlap
  const officialsByTheme = new Map<string, CircleOfficial[]>()
  officials?.forEach(off => {
    const focusIds = (off.focus_area_ids || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
    const themes = new Set<string>()
    focusIds.forEach((fid: string) => {
      const theme = focusToTheme.get(fid)
      if (theme) themes.add(theme)
    })
    const mapped: CircleOfficial = {
      id: off.official_id,
      name: off.official_name,
      role: off.title || '',
      level: off.level || '',
      jur: off.jurisdiction || '',
      rel: '',
      note: off.description_5th_grade || '',
      phone: off.office_phone || '',
      website: off.website,
    }
    if (themes.size === 0) {
      // Assign to Voice (THEME_04) as default for officials without focus areas
      const existing = officialsByTheme.get('THEME_04') || []
      existing.push(mapped)
      officialsByTheme.set('THEME_04', existing)
    } else {
      themes.forEach(themeId => {
        const existing = officialsByTheme.get(themeId) || []
        existing.push(mapped)
        officialsByTheme.set(themeId, existing)
      })
    }
  })

  // Map policies to themes via focus_area_ids overlap
  const policiesByTheme = new Map<string, CirclePolicy[]>()
  policies?.forEach(pol => {
    const focusIds = (pol.focus_area_ids || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
    const themes = new Set<string>()
    focusIds.forEach((fid: string) => {
      const theme = focusToTheme.get(fid)
      if (theme) themes.add(theme)
    })
    const mapped: CirclePolicy = {
      id: pol.policy_id,
      name: pol.policy_name || pol.bill_number || '',
      status: pol.status || 'Active',
      body: pol.policy_type || pol.level || '',
      level: pol.level || '',
      rel: '',
      desc: pol.summary_5th_grade || '',
      plain: pol.summary_5th_grade || '',
      source_url: pol.source_url,
    }
    if (themes.size === 0) {
      const existing = policiesByTheme.get('THEME_04') || []
      existing.push(mapped)
      policiesByTheme.set('THEME_04', existing)
    } else {
      themes.forEach(themeId => {
        const existing = policiesByTheme.get(themeId) || []
        existing.push(mapped)
        policiesByTheme.set(themeId, existing)
      })
    }
  })

  // Compute bridges: count content items shared between pathways via pathway_secondary
  const bridgeCounts = new Map<string, number>()
  content?.forEach(c => {
    if (c.pathway_primary && c.pathway_secondary && Array.isArray(c.pathway_secondary)) {
      c.pathway_secondary.forEach((sec: string) => {
        if (sec !== c.pathway_primary) {
          const key = [c.pathway_primary, sec].sort().join('|')
          bridgeCounts.set(key, (bridgeCounts.get(key) || 0) + 1)
        }
      })
    }
  })

  // Build bridges array (theme index pairs with counts)
  const themeKeys = PATHWAY_CONFIG.map(p => p.key)
  const bridges: [number, number, number, string][] = []
  bridgeCounts.forEach((count, key) => {
    const [a, b] = key.split('|')
    const ai = themeKeys.indexOf(a)
    const bi = themeKeys.indexOf(b)
    if (ai >= 0 && bi >= 0 && count > 0) {
      const nameA = PATHWAY_CONFIG[ai].name.toLowerCase()
      const nameB = PATHWAY_CONFIG[bi].name.toLowerCase()
      bridges.push([ai, bi, count, `${nameA} + ${nameB}`])
    }
  })

  // Sort bridges by count descending, keep top 11 (matching original)
  bridges.sort((a, b) => b[2] - a[2])
  const topBridges = bridges.slice(0, 11)

  // Fallback bridges if none computed from DB data
  const fallbackBridges: [number, number, number, string][] = [
    [0, 1, 12, 'health + families'], [1, 2, 15, 'education + neighborhoods'],
    [2, 3, 8, 'neighborhood voice'], [3, 6, 10, 'civic + bridging'],
    [0, 5, 5, 'health + environment'], [4, 1, 9, 'financial + family'],
    [2, 5, 7, 'green neighborhoods'], [4, 3, 6, 'economic + civic'],
    [0, 6, 4, 'healing + connection'], [1, 6, 7, 'family + community'],
    [5, 6, 5, 'planet + collective'],
  ]

  // Build pathways
  const pathways: CirclePathway[] = PATHWAY_CONFIG.map((config, idx) => {
    const themeContent = contentByTheme.get(config.key) || []
    const themeOfficials = officialsByTheme.get(config.key) || []
    const themePolicies = policiesByTheme.get(config.key) || []
    const topics = themeFocusAreas.get(config.key) || []

    const resources: CircleResource[] = themeContent.map(c => ({
      id: c.id,
      title: c.title_6th_grade || '',
      center: mapCenter(c.center),
      summary: c.summary_6th_grade || '',
      org: (c.org_id && orgMap.get(c.org_id)) || c.source_domain || '',
      desc: c.summary_6th_grade || '',
      source_url: c.source_url,
      engagement_level: c.engagement_level,
    }))

    return {
      id: idx,
      key: config.key,
      name: config.name,
      color: config.color,
      sub: config.sub,
      count: resources.length,
      topics: topics.slice(0, 8),
      resources,
      officials: themeOfficials.slice(0, 10),
      policies: themePolicies.slice(0, 10),
      isCenter: config.isCenter,
    }
  })

  // Collect distinct engagement levels from content
  const engagementSet = new Set<string>()
  content?.forEach(c => {
    if (c.engagement_level) engagementSet.add(c.engagement_level)
  })
  const engagementLevels = Array.from(engagementSet).sort()

  // Stats
  const totalResources = content?.length || 0
  const totalOfficials = officials?.length || 0
  const totalPolicies = policies?.length || 0
  const totalFocusAreas = focusAreas?.length || 0

  // Officials for home display (pick top 4 by level order)
  const levelOrder: Record<string, number> = { City: 0, County: 1, State: 2, Federal: 3 }
  const sortedOfficials = [...(officials || [])]
    .sort((a, b) => (levelOrder[b.level || ''] ?? 99) - (levelOrder[a.level || ''] ?? 99))
    .slice(0, 4)

  const officialsHome = sortedOfficials.map(off => ({
    name: off.official_name,
    title: off.title || '',
    level: off.level || '',
    since: off.term_end ? `Term ends ${off.term_end}` : '',
  }))

  return {
    pathways,
    bridges: topBridges.length > 0 ? topBridges : fallbackBridges,
    stats: {
      resources: totalResources,
      officials: totalOfficials,
      policies: totalPolicies,
      focusAreas: totalFocusAreas,
    },
    officialsHome,
    engagementLevels,
  }
}
