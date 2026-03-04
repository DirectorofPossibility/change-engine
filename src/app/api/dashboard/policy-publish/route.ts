import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { policy_ids } = await req.json()
  if (!Array.isArray(policy_ids) || policy_ids.length === 0) {
    return NextResponse.json({ error: 'policy_ids required' }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from('policies')
    .update({
      is_published: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'dashboard',
    })
    .in('policy_id', policy_ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, published: policy_ids.length })
}
