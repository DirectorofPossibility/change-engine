import { createClient } from '@/lib/supabase/server'
import { PolicyReviewClient } from './PolicyReviewClient'

export default async function PolicyReviewPage() {
  const supabase = await createClient()

  // Fetch policies that have been classified but not yet published
  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .not('classification_v2', 'is', null)
    .order('last_updated', { ascending: false })
    .limit(200)

  return <PolicyReviewClient initialPolicies={(policies || []) as any} />
}
