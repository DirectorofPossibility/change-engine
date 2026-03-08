import { createClient } from '@/lib/supabase/server'
/** Fetch active opportunities sharing any of the given focus areas via junction table. */
export async function getRelatedOpportunities(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('opportunity_focus_areas')
    .select('opportunity_id')
    .in('focus_id', focusAreaIds)
  const oppIds = Array.from(new Set((junctions ?? []).map(j => j.opportunity_id)))
  if (oppIds.length === 0) return []
  const { data } = await supabase
    .from('opportunities')
    .select('*')
    .in('opportunity_id', oppIds)
    .eq('is_active', 'Yes')
    .limit(10)
  return data ?? []
}

/** Fetch policies sharing any of the given focus areas via junction table. */
