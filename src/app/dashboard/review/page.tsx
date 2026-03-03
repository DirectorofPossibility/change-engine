import { getReviewQueue } from '@/lib/data/dashboard'
import { createClient } from '@/lib/supabase/server'
import { ReviewClient } from './ReviewClient'

export default async function ReviewPage() {
  const [items, supabase] = await Promise.all([
    getReviewQueue(),
    createClient(),
  ])
  const { data: segments } = await supabase
    .from('audience_segments')
    .select('segment_id, segment_name')
  const segmentMap: Record<string, string> = {}
  if (segments) {
    for (const s of segments) {
      segmentMap[s.segment_id] = s.segment_name
    }
  }
  return <ReviewClient initialItems={items} segmentMap={segmentMap} />
}
