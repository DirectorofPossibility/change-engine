import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/roles'

export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile()
  if (!profile || (profile.role !== 'admin' && (profile.role as string) !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { key, enabled } = body

  if (typeof key !== 'string' || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload: key (string) and enabled (boolean) required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('site_config' as any)
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, key, enabled })
}
