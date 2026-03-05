import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, role, account_status')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const p = profile as unknown as { id: string; role: string; account_status: string }

    if (p.account_status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 })
    }

    // Only users and neighbors can request upgrades
    if (p.role === 'admin' || p.role === 'partner') {
      return NextResponse.json({ error: 'You already have elevated access' }, { status: 400 })
    }

    const body = await req.json()
    const { requested_role, reason, org_name } = body

    if (!requested_role || !['neighbor', 'partner'].includes(requested_role)) {
      return NextResponse.json({ error: 'Invalid requested role' }, { status: 400 })
    }

    if (requested_role === 'neighbor' && p.role === 'neighbor') {
      return NextResponse.json({ error: 'You are already a neighbor' }, { status: 400 })
    }

    if (requested_role === 'partner' && !org_name?.trim()) {
      return NextResponse.json({ error: 'Organization name is required for partner requests' }, { status: 400 })
    }

    // Check for existing pending request
    const { data: existing } = await supabase
      .from('role_requests' as any)
      .select('id')
      .eq('user_id', p.id)
      .eq('status', 'pending')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'You already have a pending request' }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('role_requests' as any)
      .insert({
        user_id: p.id,
        requested_role,
        reason: reason?.trim() || null,
        org_name: org_name?.trim() || null,
        status: 'pending',
      })

    if (insertError) {
      console.error('Role request insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted for review.',
    })
  } catch (err) {
    console.error('Role request error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: requests } = await supabase
      .from('role_requests' as any)
      .select('id, requested_role, org_name, reason, status, review_note, created_at, reviewed_at')
      .eq('user_id', (profile as any).id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ requests: requests || [] })
  } catch (err) {
    console.error('Role request GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
