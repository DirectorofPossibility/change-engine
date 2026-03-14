import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') || ''
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('org_id, org_name')
    .ilike('org_name', '%' + q + '%')
    .order('org_name')
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    results: (data || []).map(o => ({ id: o.org_id, label: o.org_name })),
  })
}
