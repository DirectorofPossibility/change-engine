import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_ENTITY_TYPES = [
  'content_published',
  'organizations',
  'services_211',
  'elected_officials',
  'policies',
  'opportunities',
  'neighborhoods',
  'life_situations',
  'community_events',
  'elections',
]

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { entity_type, entity_id, entity_name, field_name, reason, submitter_email } = body

  if (!entity_type || !entity_id || !reason?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!ALLOWED_ENTITY_TYPES.includes(entity_type)) {
    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
  }

  if (reason.trim().length > 1000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  if (submitter_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitter_email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.from('community_edits').insert({
    entity_type,
    entity_id,
    entity_name: entity_name || null,
    field_name: field_name || null,
    reason: reason.trim(),
    submitter_email: submitter_email || null,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
