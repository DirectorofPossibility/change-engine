import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('rss_feeds')
    .select('*')
    .order('feed_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('rss_feeds')
    .insert({
      feed_name: body.feed_name,
      feed_url: body.feed_url,
      source_domain: body.source_domain || null,
      is_active: true,
      poll_interval_hours: body.poll_interval_hours || 24,
      category: body.category || 'news',
      pathway_hint: body.pathway_hint || null,
      notes: body.notes || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Clean empty strings to null for optional fields
  const cleaned: Record<string, any> = {}
  for (const [key, value] of Object.entries(updates)) {
    cleaned[key] = value === '' ? null : value
  }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('rss_feeds')
    .update(cleaned)
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('rss_feeds')
    .delete()
    .eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
