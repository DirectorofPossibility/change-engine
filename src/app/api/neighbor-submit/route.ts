import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check role and account status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, account_status')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const p = profile as unknown as { role: string; account_status: string }
    const allowedRoles = ['neighbor', 'partner', 'admin']
    if (!allowedRoles.includes(p.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (p.account_status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 })
    }

    const body = await req.json()
    const { url, note } = body

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url.trim())
    } catch {
      return NextResponse.json({ error: 'Please provide a valid URL' }, { status: 400 })
    }

    // Insert into content_inbox
    const { error: insertError } = await supabase
      .from('content_inbox')
      .insert({
        source_url: url.trim(),
        source: 'community',
        submitted_by: user.id,
        status: 'pending',
        notes: note?.trim() || null,
      } as any)

    if (insertError) {
      console.error('Neighbor submit insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit resource' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your resource has been submitted for review.',
    })
  } catch (err) {
    console.error('Neighbor submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
