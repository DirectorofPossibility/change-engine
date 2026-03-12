/**
 * @fileoverview POST /api/cron/send-reminders — Daily election reminder dispatch.
 *
 * Checks upcoming election deadlines and sends reminders to active subscribers:
 *   - 7 days before registration_deadline → "Register by [date]"
 *   - 1 day before early_voting_start → "Early voting starts tomorrow"
 *   - 1 day before election_date → "Election Day is tomorrow"
 *
 * MVP: Generates email body and logs it. Actual sending can be wired up later.
 *
 * Auth: Requires CRON_SECRET bearer token.
 * Schedule: Daily at 8 AM CT (0 14 * * * UTC).
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const CRON_SECRET = process.env.CRON_SECRET

interface Election {
  election_id: string
  election_name: string
  election_date: string
  registration_deadline: string | null
  early_voting_start: string | null
  early_voting_end: string | null
}

interface Subscriber {
  id: string
  email: string
  zip_code: string | null
  reminder_types: string[]
  unsubscribe_token: string
}

async function supaRest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...((options.headers as Record<string, string>) || {}),
    },
  })
  if (options.method === 'POST' || options.method === 'PATCH') {
    return { ok: res.ok, status: res.status }
  }
  if (!res.ok) return { data: null, ok: false, status: res.status }
  const data = await res.json()
  return { data, ok: true, status: res.status }
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00Z')
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function buildEmailHtml(
  type: 'registration' | 'early_voting' | 'election_day',
  election: Election,
  unsubscribeToken: string,
): { subject: string; html: string } {
  const baseUrl = 'https://www.changeengine.us'
  const unsubUrl = `${baseUrl}/api/reminders?token=${unsubscribeToken}`

  const templates = {
    registration: {
      subject: `Voter Registration Deadline: ${formatDate(election.registration_deadline!)}`,
      heading: 'Registration Deadline Approaching',
      body: `The voter registration deadline for <strong>${election.election_name}</strong> is <strong>${formatDate(election.registration_deadline!)}</strong> — just 7 days away. Make sure you're registered to vote!`,
      cta: { text: 'Check Your Registration', url: `${baseUrl}/register-to-vote` },
    },
    early_voting: {
      subject: `Early Voting Starts Tomorrow for ${election.election_name}`,
      heading: 'Early Voting Starts Tomorrow',
      body: `Early voting for <strong>${election.election_name}</strong> begins tomorrow, <strong>${formatDate(election.early_voting_start!)}</strong>${election.early_voting_end ? ` and runs through ${formatDate(election.early_voting_end)}` : ''}. Beat the lines and vote early!`,
      cta: { text: 'Find Polling Locations', url: `${baseUrl}/voting-locations` },
    },
    election_day: {
      subject: `Election Day is Tomorrow: ${election.election_name}`,
      heading: 'Election Day is Tomorrow',
      body: `<strong>${election.election_name}</strong> is tomorrow, <strong>${formatDate(election.election_date)}</strong>. Make your voice heard!`,
      cta: { text: 'Find Your Polling Place', url: `${baseUrl}/voting-locations` },
    },
  }

  const t = templates[type]

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#C75B2A;padding:24px 32px;">
          <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-family:'DM Serif Display',Georgia,serif;">${t.heading}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#2C2C2C;font-size:16px;line-height:1.6;">${t.body}</p>
          <a href="${t.cta.url}" style="display:inline-block;background:#C75B2A;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:16px;">${t.cta.text}</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #E5E5E5;">
          <p style="margin:0;color:#999;font-size:12px;">
            You received this because you signed up for election reminders on The Change Engine.<br>
            <a href="${unsubUrl}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject: t.subject, html }
}

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Fetch upcoming elections with relevant dates
  const { data: elections } = await supaRest(
    'elections?select=election_id,election_name,election_date,registration_deadline,early_voting_start,early_voting_end&election_date=gte.' +
      new Date().toISOString().slice(0, 10)
  ) as { data: Election[] | null }

  if (!elections || elections.length === 0) {
    return NextResponse.json({ message: 'No upcoming elections', sent: 0 })
  }

  // 2. Determine which reminders to send today
  const remindersToSend: { election: Election; type: 'registration' | 'early_voting' | 'election_day'; dateField: string }[] = []

  for (const el of elections) {
    if (el.registration_deadline && daysUntil(el.registration_deadline) === 7) {
      remindersToSend.push({ election: el, type: 'registration', dateField: el.registration_deadline })
    }
    if (el.early_voting_start && daysUntil(el.early_voting_start) === 1) {
      remindersToSend.push({ election: el, type: 'early_voting', dateField: el.early_voting_start })
    }
    if (el.election_date && daysUntil(el.election_date) === 1) {
      remindersToSend.push({ election: el, type: 'election_day', dateField: el.election_date })
    }
  }

  if (remindersToSend.length === 0) {
    return NextResponse.json({ message: 'No reminders due today', sent: 0 })
  }

  // 3. Fetch active subscribers
  const { data: subscribers } = await supaRest(
    'election_reminders?is_active=eq.true&select=id,email,zip_code,reminder_types,unsubscribe_token'
  ) as { data: Subscriber[] | null }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: 'No active subscribers', sent: 0 })
  }

  // 4. Send reminders (MVP: log + record in election_reminder_log)
  let sent = 0
  const errors: string[] = []

  for (const { election, type } of remindersToSend) {
    // Filter subscribers who opted in to this reminder type
    const eligible = subscribers.filter((s) => s.reminder_types.includes(type))

    for (const sub of eligible) {
      // Check if already sent (deduplicate)
      const { data: alreadySent } = await supaRest(
        `election_reminder_log?reminder_id=eq.${sub.id}&election_id=eq.${election.election_id}&reminder_type=eq.${type}&select=id`
      )
      if (alreadySent && alreadySent.length > 0) continue

      const { subject, html } = buildEmailHtml(type, election, sub.unsubscribe_token)

      // MVP: Log the email. To wire up actual sending, replace this with SMTP call.
      console.log(`[send-reminders] TO: ${sub.email} | SUBJECT: ${subject}`)

      // Record in log to prevent duplicates
      const logResult = await supaRest('election_reminder_log', {
        method: 'POST',
        body: JSON.stringify({
          reminder_id: sub.id,
          election_id: election.election_id,
          reminder_type: type,
          scheduled_date: new Date().toISOString().slice(0, 10),
          email_subject: subject,
        }),
      })

      if (!logResult.ok) {
        errors.push(`Failed to log reminder for ${sub.email}: ${type}`)
      } else {
        sent++
      }
    }
  }

  return NextResponse.json({
    message: `Processed ${remindersToSend.length} reminder(s) for ${subscribers.length} subscriber(s)`,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  })
}
