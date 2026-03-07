import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { edit_id, status } = body as { edit_id: string; status: string }

  if (!edit_id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid edit_id or status' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('community_edits')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.email || user?.id || null,
    })
    .eq('edit_id', edit_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
