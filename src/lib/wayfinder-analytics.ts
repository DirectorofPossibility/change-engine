/**
 * Lightweight Wayfinder analytics tracker.
 * Fires non-blocking POST requests to Supabase to record engagement events.
 * No PII is collected — only event type, payload, and an anonymous session ID.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/** Generate a short anonymous session ID (persisted per browser session). */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('wf_sid')
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    sessionStorage.setItem('wf_sid', sid)
  }
  return sid
}

type WayfinderEventType =
  | 'pathway_click'
  | 'archetype_select'
  | 'zip_set'
  | 'search'
  | 'detail_view'
  | 'tier_expand'

/**
 * Track a Wayfinder engagement event.
 * Non-blocking — errors are silently swallowed.
 */
export function trackWayfinderEvent(
  eventType: WayfinderEventType,
  eventData: Record<string, string | number | boolean | null> = {}
): void {
  if (typeof window === 'undefined') return
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

  const payload = {
    event_type: eventType,
    event_data: eventData,
    session_id: getSessionId(),
  }

  // Fire-and-forget — use sendBeacon if available for reliability on page unload
  const url = SUPABASE_URL + '/rest/v1/wayfinder_events'
  const body = JSON.stringify(payload)
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Prefer': 'return=minimal',
  }

  fetch(url, { method: 'POST', headers, body, keepalive: true }).catch(function () {})
}
