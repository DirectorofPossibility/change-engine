'use server'

import { createClient } from '@/lib/supabase/server'

/** Trigger batch translation via the internal /api/translate route using the service role key. */
export async function translateAll() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const CRON_SECRET = process.env.CRON_SECRET
  if (!CRON_SECRET) throw new Error('Server configuration missing')

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CRON_SECRET}`,
    },
    body: JSON.stringify({ tables: ['content_published'], languages: ['es', 'vi'], limit: 50 }),
  })
  return res.json()
}
