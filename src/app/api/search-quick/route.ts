/**
 * @fileoverview GET /api/search-quick — Lightweight search for header autocomplete.
 *
 * Returns up to 8 quick results across content, services, officials, and organizations.
 * Much lighter than the full /search page — no translations, no pagination.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TYPE_COLORS: Record<string, string> = {
  content: '#3182ce',
  service: '#C75B2A',
  official: '#805ad5',
  organization: '#38a169',
  opportunity: '#d69e2e',
  election: '#e53e3e',
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  const tsQuery = q.trim().split(/\s+/).join(' & ')

  const [content, services, officials, orgs, opportunities] = await Promise.all([
    supabase
      .from('content_published')
      .select('id, title_6th_grade')
      .textSearch('fts', tsQuery)
      .eq('is_active', true)
      .limit(2),
    supabase
      .from('services_211')
      .select('service_id, service_name')
      .textSearch('fts', tsQuery)
      .eq('is_active', 'Yes')
      .limit(2),
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title')
      .textSearch('fts', tsQuery)
      .limit(2),
    supabase
      .from('organizations')
      .select('org_id, org_name')
      .textSearch('fts', tsQuery)
      .limit(2),
    supabase
      .from('opportunities')
      .select('opportunity_id, opportunity_name')
      .textSearch('fts', tsQuery)
      .eq('is_active', 'Yes')
      .limit(1),
  ])

  const results: Array<{ type: string; id: string; name: string; href: string; color: string }> = []

  for (const item of content.data || []) {
    results.push({ type: 'Article', id: item.id, name: item.title_6th_grade || 'Untitled', href: '/content/' + item.id, color: TYPE_COLORS.content })
  }
  for (const item of services.data || []) {
    results.push({ type: 'Service', id: item.service_id, name: item.service_name || 'Service', href: '/services', color: TYPE_COLORS.service })
  }
  for (const item of officials.data || []) {
    results.push({ type: 'Official', id: item.official_id, name: item.official_name || 'Official', href: '/officials/' + item.official_id, color: TYPE_COLORS.official })
  }
  for (const item of orgs.data || []) {
    results.push({ type: 'Organization', id: item.org_id, name: item.org_name || 'Organization', href: '/organizations/' + item.org_id, color: TYPE_COLORS.organization })
  }
  for (const item of opportunities.data || []) {
    results.push({ type: 'Opportunity', id: item.opportunity_id, name: item.opportunity_name || 'Opportunity', href: '/opportunities', color: TYPE_COLORS.opportunity })
  }

  return NextResponse.json({ results: results.slice(0, 8) })
}
