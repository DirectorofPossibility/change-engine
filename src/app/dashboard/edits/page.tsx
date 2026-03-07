import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { EditsReviewClient } from './EditsReviewClient'

export const dynamic = 'force-dynamic'

export default async function EditsReviewPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: edits } = await supabase
    .from('community_edits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  // Count by status
  const all = edits || []
  const counts = {
    pending: all.filter(function (e) { return e.status === 'pending' }).length,
    approved: all.filter(function (e) { return e.status === 'approved' }).length,
    rejected: all.filter(function (e) { return e.status === 'rejected' }).length,
    total: all.length,
  }

  return <EditsReviewClient edits={all} counts={counts} />
}
