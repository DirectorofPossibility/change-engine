import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Lookup officials for a ZIP code via district mapping — used by election dashboard. */
async function getOfficialsByZipForElections(supabase: SupabaseClient, zip: string) {
  const { data: zipData } = await supabase
    .from('zip_codes')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .single()

  if (!zipData) return { federal: [], state: [], county: [], city: [] }

  const districts = [
    zipData.congressional_district,
    zipData.state_senate_district,
    zipData.state_house_district,
  ].filter(Boolean)

  const { data: hoodRows } = await supabase
    .from('neighborhoods')
    .select('council_district')
    .like('zip_codes', '%' + zip + '%')
    .not('council_district', 'is', null)
    .limit(1)

  const councilDistrict = hoodRows?.[0]?.council_district || null

  let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
  filterParts += ',and(level.eq.Federal,district_id.is.null)'
  if (councilDistrict) filterParts += ',district_id.eq.' + councilDistrict
  filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
  if (zipData.county_id) filterParts += ',counties_served.like.%' + zipData.county_id + '%'

  const { data: officials } = await supabase
    .from('elected_officials')
    .select('*')
    .or(filterParts)
    .order('official_name')

  const all = officials ?? []
  return {
    federal: all.filter(function (o) { return o.level === 'Federal' }),
    state: all.filter(function (o) { return o.level === 'State' }),
    county: all.filter(function (o) { return o.level === 'County' }),
    city: all.filter(function (o) { return o.level === 'City' }),
  }
}

/** Fetch the next upcoming active election, or null if none. */
export async function getNextElection(): Promise<{
  election_name: string
  election_date: string
  election_type: string | null
  polls_open: string | null
  polls_close: string | null
  find_polling_url: string | null
  register_url: string | null
  registration_deadline: string | null
  early_voting_start: string | null
  early_voting_end: string | null
  description: string | null
} | null> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('elections')
    .select('*')
    .eq('is_active', 'Yes')
    .gte('election_date', today)
    .order('election_date', { ascending: true })
    .limit(1)
  if (!data || data.length === 0) return null
  const row = data[0] as any
  return {
    election_name: row.election_name,
    election_date: row.election_date,
    election_type: row.election_type ?? null,
    polls_open: row.polls_open ?? null,
    polls_close: row.polls_close ?? null,
    find_polling_url: row.find_polling_url ?? null,
    register_url: row.register_url ?? null,
    registration_deadline: row.registration_deadline ?? null,
    early_voting_start: row.early_voting_start ?? null,
    early_voting_end: row.early_voting_end ?? null,
    description: row.description ?? null,
  }
}

// ── Homepage data ──────────────────────────────────────────────────────

/**
 * Aggregate counts for the stats bar at the bottom of the homepage.
 * Note: `newsItems` counts newsfeed articles (content_published), NOT resources.
 * Resources are services + organizations + benefit programs.
 */

/** Election dashboard data — past/upcoming elections, candidates, ballot items, civic events, officials. */
export async function getElectionDashboard(zip?: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: pastElections },
    { data: upcomingElections },
    { data: civicEvents },
  ] = await Promise.all([
    supabase.from('elections').select('*').lt('election_date', today).order('election_date', { ascending: false }).limit(5),
    supabase.from('elections').select('*').gte('election_date', today).eq('is_active', 'Yes').order('election_date', { ascending: true }),
    supabase.from('civic_calendar').select('*').eq('is_active', 'Yes').order('date_start', { ascending: true }).limit(15),
  ])

  // Fetch candidates + ballot items for the most recent past election
  const recentElection = pastElections && pastElections.length > 0 ? pastElections[0] : null
  const nextElection = upcomingElections && upcomingElections.length > 0 ? upcomingElections[0] : null

  const [
    { data: recentCandidates },
    { data: recentBallotItems },
    { data: upcomingCandidates },
    { data: upcomingBallotItems },
  ] = await Promise.all([
    recentElection
      ? supabase.from('candidates').select('*').eq('election_id', recentElection.election_id).eq('is_active', 'Yes')
      : Promise.resolve({ data: [] as any[] }),
    recentElection
      ? supabase.from('ballot_items').select('*').eq('election_id', recentElection.election_id)
      : Promise.resolve({ data: [] as any[] }),
    nextElection
      ? supabase.from('candidates').select('*').eq('election_id', nextElection.election_id).eq('is_active', 'Yes')
      : Promise.resolve({ data: [] as any[] }),
    nextElection
      ? supabase.from('ballot_items').select('*').eq('election_id', nextElection.election_id)
      : Promise.resolve({ data: [] as any[] }),
  ])

  // Fetch officials (filtered by ZIP via district lookup) and related content in parallel
  const [officialsByZip, { data: relatedContent }] = await Promise.all([
    zip
      ? getOfficialsByZipForElections(supabase, zip)
      : Promise.resolve({ federal: [], state: [], county: [], city: [] }),
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, image_url, source_url, published_at')
      .or('title_6th_grade.ilike.%elect%,title_6th_grade.ilike.%vote%,title_6th_grade.ilike.%ballot%,title_6th_grade.ilike.%civic%')
      .order('published_at', { ascending: false })
      .limit(6),
  ])

  return {
    pastElections: pastElections ?? [],
    upcomingElections: upcomingElections ?? [],
    civicEvents: civicEvents ?? [],
    recentCandidates: recentCandidates ?? [],
    recentBallotItems: recentBallotItems ?? [],
    upcomingCandidates: upcomingCandidates ?? [],
    upcomingBallotItems: upcomingBallotItems ?? [],
    officialsByLevel: officialsByZip,
    relatedContent: relatedContent ?? [],
  }
}

/** All active 211 services, enriched with parent org names. */
