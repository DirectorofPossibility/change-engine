import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import type { ServiceWithOrg } from '@/lib/types/exchange'

type ContentRow = Database['public']['Tables']['content_published']['Row'] & { content_type?: string | null }
/** All life situations, ordered for display. Featured/critical ones show on the homepage. */
export async function getLifeSituations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .order('display_order', { ascending: true })
  return data ?? []
}


export async function getLifeSituation(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .eq('situation_slug', slug)
    .single()
  return data
}

/**
 * Fetch content + services relevant to a life situation.
 * Resolves focus areas via the life_situation_focus_areas junction table,
 * then finds matching content via content_focus_areas junction.
 * Services are resolved via life_situation_service_categories junction.
 * When zipCode is provided, services are additionally filtered by geography.
 */

/**
 * Fetch content + services relevant to a life situation.
 * Resolves focus areas via the life_situation_focus_areas junction table,
 * then finds matching content via content_focus_areas junction.
 * Services are resolved via life_situation_service_categories junction.
 * When zipCode is provided, services are additionally filtered by geography.
 */
export async function getLifeSituationContent(situationId: string, serviceCatIds: string | null, zipCode?: string) {
  const supabase = await createClient()

  // Get focus area IDs from junction table
  const { data: focusJunctions } = await supabase
    .from('life_situation_focus_areas')
    .select('focus_id')
    .eq('situation_id', situationId)
  const focusIds = (focusJunctions ?? []).map(j => j.focus_id)

  let content: ContentRow[] = []
  if (focusIds.length > 0) {
    // Get content IDs that share these focus areas
    const { data: contentJunctions } = await supabase
      .from('content_focus_areas')
      .select('content_id')
      .in('focus_id', focusIds)
    const contentIds = Array.from(new Set((contentJunctions ?? []).map(j => j.content_id)))

    if (contentIds.length > 0) {
      const { data: contentData } = await supabase
        .from('content_published')
        .select('*')
        .eq('is_active', true)
        .in('id', contentIds)
        .order('published_at', { ascending: false })
        .limit(20)
      content = contentData ?? []
    }
  }

  let services: ServiceWithOrg[] = []
  if (serviceCatIds) {
    // Get service category IDs from junction table
    const { data: catJunctions } = await supabase
      .from('life_situation_service_categories')
      .select('service_cat_id')
      .eq('situation_id', situationId)
    const catIds = (catJunctions ?? []).map(j => j.service_cat_id)

    if (catIds.length > 0) {
      let svcQuery = supabase
        .from('services_211')
        .select('*')
        .eq('is_active', 'Yes')
        .in('service_cat_id', catIds)
      if (zipCode) {
        svcQuery = svcQuery.eq('zip_code', zipCode)
      }
      const { data: svcData } = await svcQuery.limit(20)
      if (svcData) {
        const orgIds = Array.from(new Set(svcData.map(s => s.org_id).filter(Boolean)))
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('org_id, org_name')
            .in('org_id', orgIds as string[])
          const orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
          services = svcData.map(s => ({ ...s, org_name: orgMap.get(s.org_id!) ?? undefined }))
        } else {
          services = svcData
        }
      }
    }
  }

  return { content, services }
}

// ── Entity queries ─────────────────────────────────────────────────────

/** All organizations — nonprofits, agencies, foundations, etc. */
