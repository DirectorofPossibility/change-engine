/**
 * @fileoverview POST/DELETE /api/reminders — Election reminder subscription management.
 *
 * POST: Subscribe to election reminders (public, no auth required).
 * DELETE: Unsubscribe by email or unsubscribe_token.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_TYPES = ['registration', 'early_voting', 'election_day']

async function supaRest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...((options.headers as Record<string, string>) || {}),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    return { error: text, data: null, status: res.status }
  }
  return { data: text ? JSON.parse(text) : null, error: null, status: res.status }
}

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, zip_code, reminder_types } = body as {
    email?: string
    zip_code?: string
    reminder_types?: string[]
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  // Validate reminder_types if provided
  const types = reminder_types && Array.isArray(reminder_types)
    ? reminder_types.filter((t) => VALID_TYPES.includes(t))
    : VALID_TYPES

  if (types.length === 0) {
    return NextResponse.json({ error: 'At least one valid reminder type is required' }, { status: 400 })
  }

  // Upsert: if email exists, update; otherwise insert
  // First check if email exists
  const { data: existing } = await supaRest(
    `election_reminders?email=eq.${encodeURIComponent(email)}&select=id,is_active`
  )

  if (existing && existing.length > 0) {
    // Update existing record — reactivate if needed
    const { data, error } = await supaRest(
      `election_reminders?email=eq.${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          reminder_types: `{${types.join(',')}}`,
          zip_code: zip_code || null,
          is_active: true,
        }),
      }
    )
    if (error) {
      console.error('Reminder update error:', error)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Subscription updated', data: data?.[0] })
  }

  // Insert new
  const { data, error } = await supaRest('election_reminders', {
    method: 'POST',
    body: JSON.stringify({
      email,
      zip_code: zip_code || null,
      reminder_types: `{${types.join(',')}}`,
    }),
  })

  if (error) {
    console.error('Reminder insert error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Subscribed successfully', data: data?.[0] }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email && !token) {
    return NextResponse.json({ error: 'Email or unsubscribe token is required' }, { status: 400 })
  }

  const filter = email
    ? `email=eq.${encodeURIComponent(email)}`
    : `unsubscribe_token=eq.${encodeURIComponent(token!)}`

  const { error } = await supaRest(`election_reminders?${filter}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false }),
  })

  if (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Unsubscribed successfully' })
}
