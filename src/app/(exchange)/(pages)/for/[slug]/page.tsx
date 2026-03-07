import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { THEMES, CENTERS, CENTER_COLORS } from '@/lib/constants'
import {
  getExchangeStats, getNewsFeed, getResourceFeed,
  getOfficials, getServices, getOrganizations,
  getLearningPaths, getRandomQuote,
} from '@/lib/data/exchange'
import { PersonaPageClient } from './PersonaPageClient'

const PERSONA_CONFIG: Record<string, {
  name: string
  tagline: string
  description: string
  color: string
  folImage: string
  center: string | null
  heroQuestion: string
  /** Content sections to show, in priority order */
  sections: Array<{
    key: string
    title: string
    question: string
    seeAllHref: string
    type: 'content' | 'services' | 'officials' | 'organizations' | 'opportunities' | 'learning-paths'
    center?: string
    contentFilter?: string
  }>
  quickActions: Array<{ label: string; href: string; color: string }>
}> = {
  seeker: {
    name: 'The Seeker',
    tagline: 'Find what is available to you',
    description: 'You are looking for resources, services, and support. Whether it is food access, legal help, job training, or healthcare — you want to know what exists and how to reach it. Your community has a rich network of organizations and services ready to help.',
    color: '#d69e2e',
    folImage: '/images/fol/seed-of-life.svg',
    center: 'Resource',
    heroQuestion: "What's available to me?",
    sections: [
      { key: 'services', title: 'Services Near You', question: 'What support is available?', seeAllHref: '/services', type: 'services' },
      { key: 'organizations', title: 'Organizations', question: 'Who can help?', seeAllHref: '/organizations', type: 'organizations' },
      { key: 'resource-content', title: 'Guides and Resources', question: 'How do I access what I need?', seeAllHref: '/library', type: 'content', center: 'Resource' },
      { key: 'learning', title: 'Learning Paths', question: 'Build your knowledge step by step', seeAllHref: '/learn', type: 'learning-paths' },
    ],
    quickActions: [
      { label: 'Search Services', href: '/services', color: '#d69e2e' },
      { label: 'Find Organizations', href: '/organizations', color: '#dd6b20' },
      { label: 'Benefits Finder', href: '/benefits', color: '#38a169' },
      { label: 'Ask Chance', href: '/chat', color: '#C75B2A' },
    ],
  },
  learner: {
    name: 'The Learner',
    tagline: 'Understand issues through community',
    description: 'You want to learn how things work — from housing policy to climate resilience to education access. You read, watch, and listen to build understanding before acting. Knowledge is the foundation of meaningful change.',
    color: '#3182ce',
    folImage: '/images/fol/vesica-piscis.svg',
    center: 'Learning',
    heroQuestion: 'How can I understand?',
    sections: [
      { key: 'learning-content', title: 'Latest Research and Analysis', question: 'What do I need to know?', seeAllHref: '/news', type: 'content', center: 'Learning' },
      { key: 'learning-paths', title: 'Learning Paths', question: 'Structured journeys into civic topics', seeAllHref: '/learn', type: 'learning-paths' },
      { key: 'resource-content', title: 'Guides and Deep Dives', question: 'Go deeper on what matters', seeAllHref: '/library', type: 'content', contentFilter: 'guide' },
      { key: 'officials', title: 'Your Representatives', question: 'Who makes decisions?', seeAllHref: '/officials', type: 'officials' },
    ],
    quickActions: [
      { label: 'Browse Library', href: '/library', color: '#3182ce' },
      { label: 'Learning Paths', href: '/learn', color: '#805ad5' },
      { label: 'Read the News', href: '/news', color: '#319795' },
      { label: 'Ask Chance', href: '/chat', color: '#C75B2A' },
    ],
  },
  builder: {
    name: 'The Builder',
    tagline: 'Contribute and create solutions',
    description: 'You are ready to act. You volunteer, organize events, join campaigns, and build alongside your neighbors. You see opportunities where others see obstacles. Your energy and skills can shape the community you want to live in.',
    color: '#38a169',
    folImage: '/images/fol/tripod-of-life.svg',
    center: 'Action',
    heroQuestion: 'How can I help?',
    sections: [
      { key: 'opportunities', title: 'Volunteer and Get Involved', question: 'Where can I show up?', seeAllHref: '/opportunities', type: 'opportunities' },
      { key: 'action-content', title: 'Campaigns and Calls to Action', question: 'What needs doing right now?', seeAllHref: '/news', type: 'content', center: 'Action' },
      { key: 'organizations', title: 'Organizations to Join', question: 'Who is building with you?', seeAllHref: '/organizations', type: 'organizations' },
      { key: 'events', title: 'Upcoming Events', question: "What's happening near you?", seeAllHref: '/calendar', type: 'content', contentFilter: 'event' },
    ],
    quickActions: [
      { label: 'Find Opportunities', href: '/opportunities', color: '#38a169' },
      { label: 'View Calendar', href: '/calendar', color: '#3182ce' },
      { label: 'Organizations', href: '/organizations', color: '#dd6b20' },
      { label: 'Submit a Resource', href: '/me/submit', color: '#C75B2A' },
    ],
  },
  watchdog: {
    name: 'The Watchdog',
    tagline: 'Hold power accountable',
    description: 'You track decisions, follow the money, attend public meetings, and hold elected officials accountable. Transparency is your tool for change. Democracy works best when people pay attention.',
    color: '#805ad5',
    folImage: '/images/fol/metatrons-cube.svg',
    center: 'Accountability',
    heroQuestion: 'Who makes decisions?',
    sections: [
      { key: 'officials', title: 'Elected Officials', question: 'Who represents you?', seeAllHref: '/officials', type: 'officials' },
      { key: 'policies', title: 'Policy Tracker', question: 'What is being decided?', seeAllHref: '/policies', type: 'content', center: 'Accountability' },
      { key: 'accountability-content', title: 'Accountability News', question: 'What should you know?', seeAllHref: '/news', type: 'content', center: 'Accountability' },
      { key: 'elections', title: 'Elections and Voting', question: 'How do you exercise your voice?', seeAllHref: '/elections', type: 'content', contentFilter: 'announcement' },
    ],
    quickActions: [
      { label: 'Find Your Officials', href: '/officials', color: '#805ad5' },
      { label: 'Track Policies', href: '/policies', color: '#3182ce' },
      { label: 'Elections Hub', href: '/elections', color: '#e53e3e' },
      { label: 'Call Your Senators', href: '/call-your-senators', color: '#C75B2A' },
    ],
  },
  partner: {
    name: 'The Partner',
    tagline: 'Connect and collaborate',
    description: 'You are an organization, a civic leader, or a community connector. You work across boundaries — bridging the gap between institutions and the people they serve. You build coalitions, share resources, and amplify what works.',
    color: '#dd6b20',
    folImage: '/images/fol/fruit-of-life.svg',
    center: null,
    heroQuestion: 'How do we work together?',
    sections: [
      { key: 'organizations', title: 'Community Organizations', question: 'Who is doing this work?', seeAllHref: '/organizations', type: 'organizations' },
      { key: 'services', title: 'Service Network', question: 'What already exists?', seeAllHref: '/services', type: 'services' },
      { key: 'partner-content', title: 'Research and Insights', question: 'What does the data say?', seeAllHref: '/library', type: 'content', center: 'Learning' },
      { key: 'opportunities', title: 'Partnership Opportunities', question: 'Where can you plug in?', seeAllHref: '/opportunities', type: 'opportunities' },
    ],
    quickActions: [
      { label: 'Organizations', href: '/organizations', color: '#dd6b20' },
      { label: 'Foundations', href: '/foundations', color: '#805ad5' },
      { label: 'Submit a Resource', href: '/me/submit', color: '#38a169' },
      { label: 'Partner Dashboard', href: '/me', color: '#C75B2A' },
    ],
  },
  explorer: {
    name: 'The Explorer',
    tagline: 'See the full picture',
    description: 'You are curious about how everything connects — pathways to policies, services to neighborhoods, officials to organizations. You explore to find patterns others miss and discover unexpected connections across the civic landscape.',
    color: '#E8723A',
    folImage: '/images/fol/flower-full.svg',
    center: null,
    heroQuestion: 'What can I discover?',
    sections: [
      { key: 'latest', title: 'Latest Across All Pathways', question: 'What is new?', seeAllHref: '/news', type: 'content' },
      { key: 'learning-paths', title: 'Learning Paths', question: 'Structured deep dives', seeAllHref: '/learn', type: 'learning-paths' },
      { key: 'officials', title: 'Officials and Governance', question: 'Who is in charge?', seeAllHref: '/officials', type: 'officials' },
      { key: 'organizations', title: 'Organizations', question: 'Who is doing the work?', seeAllHref: '/organizations', type: 'organizations' },
    ],
    quickActions: [
      { label: 'Explore Pathways', href: '/pathways', color: '#E8723A' },
      { label: 'Knowledge Graph', href: '/knowledge-graph', color: '#805ad5' },
      { label: 'Neighborhoods', href: '/neighborhoods', color: '#38a169' },
      { label: 'Search Everything', href: '/search', color: '#3182ce' },
    ],
  },
}

const ALL_SLUGS = Object.keys(PERSONA_CONFIG)

export async function generateStaticParams() {
  return ALL_SLUGS.map(function (slug) { return { slug } })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const config = PERSONA_CONFIG[slug]
  if (!config) return { title: 'Not Found' }
  return {
    title: config.name + ' | Community Exchange',
    description: config.description,
  }
}

export const revalidate = 300

export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = PERSONA_CONFIG[slug]
  if (!config) notFound()

  const supabase = await createClient()

  // Fetch data in parallel based on what this persona needs
  const sectionTypes = new Set(config.sections.map(function (s) { return s.type }))

  const [
    contentByCenter,
    allServices,
    officialsData,
    allOrgs,
    allOpportunities,
    learningPaths,
    stats,
    quote,
  ] = await Promise.all([
    // Content — fetch by center or all
    (async function () {
      const centers = config.sections
        .filter(function (s) { return s.type === 'content' })
        .map(function (s) { return s.center || s.contentFilter || 'all' })
      const results: Record<string, any[]> = {}
      for (const c of centers) {
        if (c === 'all') {
          const { data } = await supabase
            .from('content_published')
            .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url, published_at, content_type')
            .eq('is_active', true)
            .order('published_at', { ascending: false })
            .limit(12)
          results['all'] = data ?? []
        } else if (['guide', 'event', 'announcement'].includes(c)) {
          const { data } = await supabase
            .from('content_published')
            .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url, published_at, content_type')
            .eq('is_active', true)
            .eq('content_type', c)
            .order('published_at', { ascending: false })
            .limit(12)
          results[c] = data ?? []
        } else {
          const { data } = await supabase
            .from('content_published')
            .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url, published_at, content_type')
            .eq('is_active', true)
            .eq('center', c)
            .order('published_at', { ascending: false })
            .limit(12)
          results[c] = data ?? []
        }
      }
      return results
    })(),
    sectionTypes.has('services') ? getServices() : Promise.resolve([]),
    sectionTypes.has('officials') ? getOfficials() : Promise.resolve({ officials: [], levels: [], profiles: {} }),
    sectionTypes.has('organizations') ? getOrganizations() : Promise.resolve([]),
    sectionTypes.has('opportunities') ? (async function () {
      const { data } = await supabase
        .from('opportunities')
        .select('opportunity_id, title, description, organization_name, time_commitment, is_virtual, start_date, end_date')
        .eq('is_active', 'Yes' as any)
        .order('created_at', { ascending: false })
        .limit(12)
      return data ?? []
    })() : Promise.resolve([]),
    sectionTypes.has('learning-paths') ? getLearningPaths() : Promise.resolve([]),
    getExchangeStats(),
    getRandomQuote(),
  ])

  // Build section data
  const sectionData: Record<string, any[]> = {}

  for (const section of config.sections) {
    if (section.type === 'content') {
      const filterKey = section.center || section.contentFilter || 'all'
      sectionData[section.key] = (contentByCenter[filterKey] ?? []).map(function (item: any) {
        return {
          type: 'content' as const,
          id: item.id,
          title: item.title_6th_grade || 'Untitled',
          summary: item.summary_6th_grade,
          pathway: item.pathway_primary,
          center: item.center,
          imageUrl: item.image_url,
          sourceUrl: item.source_url,
          publishedAt: item.published_at,
          href: '/content/' + item.id,
        }
      })
    } else if (section.type === 'services') {
      sectionData[section.key] = (allServices as any[]).slice(0, 12).map(function (s: any) {
        return {
          type: 'service' as const,
          id: s.service_id,
          title: s.service_name || s.name || 'Service',
          summary: s.description,
          subtitle: s.category || s.org_name,
          href: '/services/' + s.service_id,
          color: '#d69e2e',
        }
      })
    } else if (section.type === 'officials') {
      sectionData[section.key] = ((officialsData as any).officials ?? []).slice(0, 12).map(function (o: any) {
        return {
          type: 'official' as const,
          id: o.official_id,
          title: o.official_name || 'Official',
          subtitle: o.title || o.office_name,
          summary: o.party ? o.party + ' — ' + (o.level || '') : o.level,
          imageUrl: o.photo_url,
          href: '/officials/' + o.official_id,
          color: '#805ad5',
        }
      })
    } else if (section.type === 'organizations') {
      sectionData[section.key] = (allOrgs as any[]).slice(0, 12).map(function (org: any) {
        return {
          type: 'organization' as const,
          id: org.org_id,
          title: org.org_name || 'Organization',
          summary: org.description_5th_grade || org.mission_statement,
          subtitle: org.org_type,
          imageUrl: org.logo_url,
          href: '/organizations/' + org.org_id,
          color: '#dd6b20',
        }
      })
    } else if (section.type === 'opportunities') {
      sectionData[section.key] = (allOpportunities as any[]).slice(0, 12).map(function (opp: any) {
        return {
          type: 'opportunity' as const,
          id: opp.opportunity_id,
          title: opp.title || 'Opportunity',
          summary: opp.description,
          subtitle: opp.organization_name || (opp.is_virtual ? 'Virtual' : ''),
          href: '/opportunities/' + opp.opportunity_id,
          color: '#38a169',
        }
      })
    } else if (section.type === 'learning-paths') {
      sectionData[section.key] = (learningPaths as any[]).slice(0, 12).map(function (lp: any) {
        return {
          type: 'content' as const,
          id: lp.path_id,
          title: lp.path_name || lp.title || 'Learning Path',
          summary: lp.description,
          subtitle: lp.difficulty_level,
          href: '/learn/' + ((lp as any).slug || lp.path_id),
          color: '#3182ce',
          center: 'Learning',
        }
      })
    }
  }

  // Build pathway stats for explorer
  const pathwayList = Object.entries(THEMES).map(function ([id, t]) {
    return { id, name: t.name, color: t.color, slug: t.slug }
  })

  return (
    <PersonaPageClient
      slug={slug}
      config={config}
      sectionData={sectionData}
      stats={stats}
      quote={quote}
      pathways={pathwayList}
    />
  )
}
