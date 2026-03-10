/**
 * @fileoverview Tools & Guides page.
 *
 * - For neighbors/partners: shows tools and guides available at their level
 * - For admins (super admin): shows admin controls to manage which tools and
 *   guides appear for each level
 *
 * @route GET /dashboard/tools-guides
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ToolsGuidesClient } from './ToolsGuidesClient'

export const metadata: Metadata = {
  title: 'Tools & Guides — Dashboard',
  description: 'Tools and guides available for your role.',
}

export const dynamic = 'force-dynamic'

interface ToolGuideItem {
  id: string
  title: string
  description: string
  url: string
  icon: string
  category: 'tool' | 'guide'
  levels: string[] // 'neighbor' | 'partner'
  sort_order: number
  active: boolean
}

// Default tools & guides when no DB table exists yet
const DEFAULT_ITEMS: ToolGuideItem[] = [
  {
    id: 'tg-01',
    title: 'Submit Content via URL',
    description: 'Share an article or resource by pasting its URL. Our team will review and classify it for the knowledge graph.',
    url: '/dashboard/submit',
    icon: 'FileText',
    category: 'tool',
    levels: ['neighbor', 'partner'],
    sort_order: 1,
    active: true,
  },
  {
    id: 'tg-02',
    title: 'Knowledge Base',
    description: 'Browse the full library of published content, organized by pathway, center, and focus area.',
    url: '/dashboard/library',
    icon: 'BookOpen',
    category: 'guide',
    levels: ['neighbor', 'partner'],
    sort_order: 2,
    active: true,
  },
  {
    id: 'tg-03',
    title: 'Create a Guide',
    description: 'Write and publish educational guides for the community on behalf of your organization.',
    url: '/dashboard/partner/guides/new',
    icon: 'PenTool',
    category: 'tool',
    levels: ['partner'],
    sort_order: 3,
    active: true,
  },
  {
    id: 'tg-04',
    title: 'Post an Event',
    description: 'Share volunteer opportunities, community events, and programs with the community.',
    url: '/dashboard/partner/events/new',
    icon: 'CalendarDays',
    category: 'tool',
    levels: ['partner'],
    sort_order: 4,
    active: true,
  },
  {
    id: 'tg-05',
    title: 'Pipeline & Ingestion',
    description: 'Submit content via API, RSS feeds, and bulk ingestion. Manage your content pipeline.',
    url: '/dashboard/pipeline',
    icon: 'Zap',
    category: 'tool',
    levels: ['partner'],
    sort_order: 5,
    active: true,
  },
  {
    id: 'tg-06',
    title: 'Understanding the Seven Pathways',
    description: 'Learn how content is organized around seven pathways of civic life and how they connect.',
    url: '/dashboard/manual#pathways',
    icon: 'Compass',
    category: 'guide',
    levels: ['neighbor', 'partner'],
    sort_order: 6,
    active: true,
  },
  {
    id: 'tg-07',
    title: 'How Content Gets Published',
    description: 'Understand the 5-step pipeline from submission to publication and translation.',
    url: '/dashboard/manual#content-pipeline',
    icon: 'Workflow',
    category: 'guide',
    levels: ['neighbor', 'partner'],
    sort_order: 7,
    active: true,
  },
  {
    id: 'tg-08',
    title: 'Graph Visualizations',
    description: 'Explore the knowledge graph, coverage heatmaps, and force-directed graph explorer.',
    url: '/dashboard/graphs',
    icon: 'BarChart3',
    category: 'tool',
    levels: ['partner'],
    sort_order: 8,
    active: true,
  },
  {
    id: 'tg-09',
    title: 'Users Manual',
    description: 'Complete guide to using the platform — pathways, centers, content pipeline, and tips for your role.',
    url: '/dashboard/manual',
    icon: 'HelpCircle',
    category: 'guide',
    levels: ['neighbor', 'partner'],
    sort_order: 9,
    active: true,
  },
  {
    id: 'tg-10',
    title: 'Civic Compass',
    description: 'Enter your address or ZIP code to find every elected official who represents you — from city council to U.S. Senate.',
    url: '/compass',
    icon: 'MapPin',
    category: 'tool',
    levels: ['neighbor', 'partner'],
    sort_order: 10,
    active: true,
  },
  {
    id: 'tg-11',
    title: 'Find Polling Places',
    description: 'Look up your nearest polling location, early voting sites, and election day details.',
    url: '/polling-places',
    icon: 'Vote',
    category: 'tool',
    levels: ['neighbor', 'partner'],
    sort_order: 11,
    active: true,
  },
  {
    id: 'tg-12',
    title: 'Manage RSS Feeds',
    description: 'Add and manage RSS feeds for automatic content ingestion. New articles are pulled, classified, and queued for review daily.',
    url: '/dashboard/feeds',
    icon: 'Rss',
    category: 'tool',
    levels: ['partner'],
    sort_order: 12,
    active: true,
  },
]

export default async function ToolsGuidesPage() {
  const supabase = await createClient()

  // Get user role
  const { data: { user } } = await supabase.auth.getUser()
  let role = 'neighbor'
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('auth_id', user.id)
      .single()
    role = profile?.role || 'user'
  }

  // Try to fetch from DB, fall back to defaults
  let items: ToolGuideItem[] = DEFAULT_ITEMS
  try {
    const { data, error } = await (supabase as any)
      .from('tool_guide_items')
      .select('*')
      .eq('active', true)
      .order('sort_order')
    if (data && data.length > 0 && !error) {
      items = data
    }
  } catch {
    // Table doesn't exist yet, use defaults
  }

  return (
    <ToolsGuidesClient
      items={items}
      role={role}
    />
  )
}
