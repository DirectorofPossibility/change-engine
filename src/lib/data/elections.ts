import { createClient } from '@/lib/supabase/server'
/** Fetch the next upcoming active election, or null if none. */
export async function getNextElection(): Promise<{
  election_name: string
  election_date: string
  election_type: string | null
  polls_open: string | null
  polls_close: string | null
  find_polling_url: string | null
  register_url: string | null
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

  // Fetch officials (if ZIP) and related content in parallel
  const [officialsRes, { data: relatedContent }] = await Promise.all([
    zip
      ? supabase.from('elected_officials').select('*').order('official_name')
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, image_url, source_url, published_at')
      .or('title_6th_grade.ilike.%elect%,title_6th_grade.ilike.%vote%,title_6th_grade.ilike.%ballot%,title_6th_grade.ilike.%civic%')
      .order('published_at', { ascending: false })
      .limit(6),
  ])
  const officials = officialsRes.data ?? []

  return {
    pastElections: pastElections ?? [],
    upcomingElections: upcomingElections ?? [],
    civicEvents: civicEvents ?? [],
    recentCandidates: recentCandidates ?? [],
    recentBallotItems: recentBallotItems ?? [],
    upcomingCandidates: upcomingCandidates ?? [],
    upcomingBallotItems: upcomingBallotItems ?? [],
    officials,
    relatedContent: relatedContent ?? [],
  }
}

/** All active 211 services, enriched with parent org names. */
