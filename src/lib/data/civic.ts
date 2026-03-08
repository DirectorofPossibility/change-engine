import { createClient } from '@/lib/supabase/server'
import { getOfficialsByZip } from './officials'
import { getPoliciesByZip } from './policies'
/** Fetch all data for the Civic Hub: officials, policies, elections, government_levels. */
export async function getCivicHubData() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: officials },
    { data: policies },
    { data: elections },
    { data: levels },
    { data: upcoming },
    { data: profileRows },
  ] = await Promise.all([
    supabase.from('elected_officials').select('*').order('official_name'),
    supabase.from('policies').select('*').order('last_action_date', { ascending: false }),
    supabase.from('elections').select('*').order('election_date', { ascending: false }),
    supabase.from('government_levels').select('*').order('level_order'),
    supabase
      .from('elections')
      .select('*')
      .eq('is_active', 'Yes')
      .gte('election_date', today)
      .order('election_date', { ascending: true })
      .limit(1),
    supabase.from('official_profiles' as any).select('official_id, social_linkedin, linkedin_status'),
  ])
  const linkedinProfiles = ((profileRows ?? []) as unknown as Array<{ official_id: string; social_linkedin: string | null; linkedin_status: string | null }>)
    .reduce<Record<string, string>>(function (acc, p) {
      if (p.social_linkedin && (!p.linkedin_status || p.linkedin_status === 'verified')) acc[p.official_id] = p.social_linkedin
      return acc
    }, {})

  return {
    officials: officials ?? [],
    policies: policies ?? [],
    elections: elections ?? [],
    levels: levels ?? [],
    upcomingElection: upcoming && upcoming.length > 0 ? upcoming[0] : null,
    linkedinProfiles,
  }
}

/** Election dashboard data — past/upcoming elections, candidates, ballot items, civic events, officials. */

/** Combined civic profile: officials + policies + geographic context for a ZIP. */
export async function getCivicProfileByZip(zip: string) {
  const [officials, policies] = await Promise.all([
    getOfficialsByZip(zip),
    getPoliciesByZip(zip),
  ])

  return { zip, officials, policies }
}

/** Get focus areas linked to a policy via policy_focus_areas. */
