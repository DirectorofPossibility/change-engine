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
  const { entityType, entityId, updates } = body as {
    entityType: string
    entityId: string
    updates: Record<string, unknown>
  }

  const config = ALLOWED_TABLES[entityType]
  if (!config) {
    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
  }
  if (!entityId || !updates || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Missing entityId or updates' }, { status: 400 })
  }

  // Strip any attempt to update the primary key
  delete updates[config.pk]

  const supabase = await createClient()
  const { error } = await supabase
    .from(config.table)
    .update(updates)
    .eq(config.pk, entityId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
