import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'

const ALLOWED_TABLES: Record<string, { table: string; pk: string }> = {
  organizations: { table: 'organizations', pk: 'org_id' },
  content_published: { table: 'content_published', pk: 'id' },
  services_211: { table: 'services_211', pk: 'service_id' },
  elected_officials: { table: 'elected_officials', pk: 'official_id' },
  policies: { table: 'policies', pk: 'policy_id' },
  opportunities: { table: 'opportunities', pk: 'id' },
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { entityType, entityId } = body as { entityType: string; entityId: string }

  const config = ALLOWED_TABLES[entityType]
  if (!config) {
    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
  }
  if (!entityId) {
    return NextResponse.json({ error: 'Missing entityId' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from(config.table)
    .select('*')
    .eq(config.pk, entityId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  return NextResponse.json({ entity: data })
}
