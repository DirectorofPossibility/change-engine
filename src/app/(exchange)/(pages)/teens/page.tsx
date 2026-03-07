import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TeenHubClient } from '@/components/exchange/TeenHub'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Teen Hub — Your City. Your Move.',
  description: 'Houston belongs to you. Find missions, connect with orgs, learn how your city works, and actually do something about it.',
  openGraph: {
    title: 'Teen Hub — Your City. Your Move.',
    description: 'Houston belongs to you. Find missions, connect with orgs, learn how your city works, and actually do something about it.',
  },
}

// Youth-relevant keyword filter for full-text search
const YOUTH_KEYWORDS = ['youth', 'teen', 'student', 'young', 'kid', 'child', 'school', 'mentoring', 'mentor', 'college', 'internship', 'scholarship']

function youthFilter(text: string | null | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return YOUTH_KEYWORDS.some(k => lower.includes(k))
}

export default async function TeenHubPage() {
  const supabase = await createClient()

  const [contentRes, orgsRes, oppsRes, eventsRes, servicesRes, statsRes] = await Promise.all([
    // Content relevant to youth
    supabase
      .from('content_published')
      .select('id, inbox_id, title_6th_grade, summary_6th_grade, image_url, pathway_primary, center, resource_type, source_url')
      .or('title_6th_grade.ilike.%youth%,title_6th_grade.ilike.%teen%,title_6th_grade.ilike.%student%,summary_6th_grade.ilike.%youth%,summary_6th_grade.ilike.%teen%,summary_6th_grade.ilike.%young people%,summary_6th_grade.ilike.%young adult%,summary_6th_grade.ilike.%mentoring%,summary_6th_grade.ilike.%college%,summary_6th_grade.ilike.%school%')
      .limit(30),

    // Youth-oriented organizations
    supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, logo_url, website')
      .or('org_name.ilike.%youth%,org_name.ilike.%teen%,org_name.ilike.%student%,org_name.ilike.%mentor%,description_5th_grade.ilike.%youth%,description_5th_grade.ilike.%teen%')
      .limit(20),

    // Youth opportunities
    supabase
      .from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade, start_date, registration_url')
      .eq('is_active', 'Yes')
      .or('opportunity_name.ilike.%youth%,opportunity_name.ilike.%teen%,opportunity_name.ilike.%student%,opportunity_name.ilike.%volunteer%,description_5th_grade.ilike.%youth%,description_5th_grade.ilike.%teen%')
      .limit(10),

    // Events
    supabase
      .from('events')
      .select('event_id, event_name, description_5th_grade, start_datetime, registration_url, is_free, is_virtual')
      .eq('is_active', 'Yes')
      .limit(20),

    // Services
    supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade')
      .eq('is_active', 'Yes')
      .or('service_name.ilike.%youth%,service_name.ilike.%teen%,service_name.ilike.%student%,description_5th_grade.ilike.%youth%,description_5th_grade.ilike.%teen%')
      .limit(10),

    // Stats for social proof
    supabase.rpc('get_exchange_stats' as any).maybeSingle(),
  ])

  const content = (contentRes.data ?? []).map(c => ({
    id: c.id,
    title: c.title_6th_grade || '',
    summary: c.summary_6th_grade || '',
    imageUrl: c.image_url,
    pathway: c.pathway_primary,
    center: c.center,
    type: c.resource_type,
    href: `/content/${c.id}`,
  }))

  const orgs = (orgsRes.data ?? []).filter(o => o.description_5th_grade).map(o => ({
    id: o.org_id,
    name: o.org_name,
    description: o.description_5th_grade || '',
    logoUrl: o.logo_url,
    website: o.website,
    href: `/organizations/${o.org_id}`,
  }))

  const opportunities = (oppsRes.data ?? []).map(o => ({
    id: o.opportunity_id,
    name: o.opportunity_name,
    description: o.description_5th_grade || '',
    startDate: o.start_date,
    registrationUrl: o.registration_url,
  }))

  // Filter events to youth-relevant ones, or show all if few match
  const allEvents = eventsRes.data ?? []
  let events = allEvents.filter(e => youthFilter(e.event_name) || youthFilter(e.description_5th_grade))
  if (events.length < 3) events = allEvents.slice(0, 8)
  const mappedEvents = events.map(e => ({
    id: e.event_id,
    name: e.event_name,
    description: e.description_5th_grade || '',
    startDatetime: e.start_datetime,
    registrationUrl: e.registration_url,
    isFree: e.is_free === 'true',
    isVirtual: e.is_virtual === 'true',
    href: `/events/${e.event_id}`,
  }))

  const services = (servicesRes.data ?? []).map(s => ({
    id: s.service_id,
    name: s.service_name,
    description: s.description_5th_grade || '',
    href: `/services/${s.service_id}`,
  }))

  // Build missions from content + opportunities + events
  const missions = {
    quickWins: content.filter(c => c.center === 'Learning').slice(0, 6).map(c => ({
      ...c, effort: '5 min read' as const, category: 'learn' as const,
    })),
    getInvolved: [
      ...opportunities.slice(0, 4).map(o => ({
        id: o.id, title: o.name, summary: o.description, href: o.registrationUrl || `/opportunities`, effort: '1-2 hours' as const, category: 'act' as const, imageUrl: null as string | null, pathway: null as string | null,
      })),
      ...mappedEvents.slice(0, 4).map(e => ({
        id: e.id, title: e.name, summary: e.description, href: e.href, effort: e.isFree ? 'Free event' as const : '1-2 hours' as const, category: 'act' as const, imageUrl: null as string | null, pathway: null as string | null,
      })),
    ],
    goDeeper: content.filter(c => c.center === 'Action' || c.center === 'Resource').slice(0, 6).map(c => ({
      ...c, effort: 'ongoing' as const, category: 'build' as const,
    })),
  }

  const stats = {
    orgs: 517,
    stories: 269,
    events: 30,
    services: 25,
  }

  return (
    <TeenHubClient
      missions={missions}
      content={content}
      orgs={orgs}
      events={mappedEvents}
      services={services}
      stats={stats}
    />
  )
}
