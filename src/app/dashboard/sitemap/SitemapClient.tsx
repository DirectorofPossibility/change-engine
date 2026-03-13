'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Globe, Layout, ExternalLink } from 'lucide-react'

// ── Tab definitions ──

const TABS = ['Sitemap', 'Wireframe'] as const

// ── Route tree data ──

interface RouteNode {
  label: string
  path: string
  children?: RouteNode[]
  dynamic?: boolean
  description?: string
}

const PUBLIC_ROUTES: RouteNode[] = [
  {
    label: 'Home', path: '/', description: 'Splash page + /home newspaper layout',
    children: [
      { label: 'Newspaper Home', path: '/home', description: 'Editorial homepage with sections' },
    ],
  },
  {
    label: 'Discover', path: '#discover', description: 'Browse and explore content',
    children: [
      { label: 'Pathways', path: '/pathways', description: '7 thematic pathways', children: [
        { label: 'Pathway Detail', path: '/pathways/[slug]', dynamic: true },
      ]},
      { label: 'Centers', path: '/centers', description: '4 centers of inquiry', children: [
        { label: 'Center Detail', path: '/centers/[slug]', dynamic: true },
      ]},
      { label: 'Search', path: '/search', description: 'Full-text + semantic search' },
      { label: 'Explore', path: '/explore', description: 'Browse by focus area', children: [
        { label: 'Focus Area', path: '/explore/focus/[id]', dynamic: true },
        { label: 'Knowledge Base', path: '/explore/knowledge-base' },
      ]},
      { label: 'Collections', path: '/collections', children: [
        { label: 'Collection', path: '/collections/[id]', dynamic: true },
      ]},
      { label: 'News', path: '/news', description: 'Latest content feed' },
      { label: 'Stories', path: '/stories', children: [
        { label: 'Story', path: '/stories/[id]', dynamic: true },
      ]},
    ],
  },
  {
    label: 'Civic Tools', path: '#civic', description: 'Government and civic participation',
    children: [
      { label: 'Officials', path: '/officials', description: 'All elected officials', children: [
        { label: 'Official Profile', path: '/officials/[id]', dynamic: true },
        { label: 'Civic Compass', path: '/officials/lookup', description: 'Find your reps by address' },
      ]},
      { label: 'Policies', path: '/policies', children: [
        { label: 'Policy Detail', path: '/policies/[id]', dynamic: true },
      ]},
      { label: 'Elections', path: '/elections', children: [
        { label: 'Election Detail', path: '/elections/[id]', dynamic: true },
      ]},
      { label: 'Candidates', path: '/candidates', children: [
        { label: 'Candidate', path: '/candidates/[id]', dynamic: true },
      ]},
      { label: 'Ballot', path: '/ballot', description: 'Ballot lookup' },
      { label: 'Polling Places', path: '/polling-places' },
      { label: 'Call Your Senators', path: '/call-your-senators' },
      { label: 'Districts', path: '/districts', description: 'District map' },
      { label: 'Governance', path: '/governance' },
      { label: 'Campaigns', path: '/campaigns', children: [
        { label: 'Campaign', path: '/campaigns/[id]', dynamic: true },
      ]},
    ],
  },
  {
    label: 'Resources', path: '#resources', description: 'Services, orgs, and support',
    children: [
      { label: 'Services', path: '/services', children: [
        { label: 'Service Detail', path: '/services/[id]', dynamic: true },
      ]},
      { label: 'Organizations', path: '/organizations', children: [
        { label: 'Organization', path: '/organizations/[id]', dynamic: true },
      ]},
      { label: 'Agencies', path: '/agencies', children: [
        { label: 'Agency', path: '/agencies/[id]', dynamic: true },
      ]},
      { label: 'Municipal Services', path: '/municipal-services', children: [
        { label: 'Service', path: '/municipal-services/[id]', dynamic: true },
      ]},
      { label: 'Benefits', path: '/benefits', children: [
        { label: 'Benefit', path: '/benefits/[id]', dynamic: true },
      ]},
      { label: 'Opportunities', path: '/opportunities', children: [
        { label: 'Opportunity', path: '/opportunities/[id]', dynamic: true },
      ]},
      { label: 'Events', path: '/events', children: [
        { label: 'Event', path: '/events/[id]', dynamic: true },
      ]},
      { label: 'Foundations', path: '/foundations', children: [
        { label: 'Foundation', path: '/foundations/[id]', dynamic: true },
      ]},
    ],
  },
  {
    label: 'Learn', path: '#learn', description: 'Knowledge and learning',
    children: [
      { label: 'Library', path: '/library', description: 'Research knowledge base', children: [
        { label: 'Category', path: '/library/category/[slug]', dynamic: true },
        { label: 'Document', path: '/library/doc/[id]', dynamic: true },
        { label: 'Ask the Library', path: '/library/chat', description: 'Chance chatbot' },
      ]},
      { label: 'Learn', path: '/learn', children: [
        { label: 'Lesson', path: '/learn/[id]', dynamic: true },
      ]},
      { label: 'Learning Paths', path: '/learning-paths', children: [
        { label: 'Path', path: '/learning-paths/[id]', dynamic: true },
      ]},
      { label: 'Guides', path: '/guides', children: [
        { label: 'Guide', path: '/guides/[slug]', dynamic: true },
      ]},
      { label: 'Bookshelf', path: '/bookshelf' },
      { label: 'FAQ', path: '/faq' },
      { label: 'Glossary', path: '/glossary' },
      { label: 'Knowledge Graph', path: '/knowledge-graph' },
    ],
  },
  {
    label: 'Community', path: '#community', description: 'Places and people',
    children: [
      { label: 'Community', path: '/community' },
      { label: 'Neighborhoods', path: '/neighborhoods', children: [
        { label: 'Neighborhood', path: '/neighborhoods/[id]', dynamic: true },
      ]},
      { label: 'Super Neighborhoods', path: '/super-neighborhoods', children: [
        { label: 'Super Neighborhood', path: '/super-neighborhoods/[id]', dynamic: true },
      ]},
      { label: 'TIRZ', path: '/tirz', children: [
        { label: 'TIRZ Detail', path: '/tirz/[id]', dynamic: true },
      ]},
      { label: 'My Area', path: '/my-area' },
      { label: 'My Neighborhood', path: '/my-neighborhood' },
      { label: 'Geography', path: '/geography' },
      { label: 'Adventures', path: '/adventures', children: [
        { label: 'Adventure', path: '/adventures/[slug]', dynamic: true },
      ]},
    ],
  },
  {
    label: 'User', path: '#user', description: 'Personal pages',
    children: [
      { label: 'My Dashboard', path: '/me', description: 'Personalized feed', children: [
        { label: 'Settings', path: '/me/settings' },
        { label: 'Submit', path: '/me/submit' },
      ]},
      { label: 'Compass', path: '/compass', description: 'Civic engagement quiz' },
      { label: 'Quizzes', path: '/quizzes' },
      { label: 'Personas', path: '/personas' },
      { label: 'For...', path: '/for/[slug]', dynamic: true, description: 'Audience landing pages' },
    ],
  },
  {
    label: 'Info', path: '#info', description: 'Static pages',
    children: [
      { label: 'About', path: '/about' },
      { label: 'Help', path: '/help', children: [
        { label: 'Life Situation', path: '/help/[slug]', dynamic: true },
      ]},
      { label: 'Manual', path: '/manual' },
      { label: 'Contact', path: '/contact' },
      { label: 'Donate', path: '/donate' },
      { label: 'Privacy', path: '/privacy' },
      { label: 'Terms', path: '/terms' },
      { label: 'Accessibility', path: '/accessibility' },
    ],
  },
]

const DASHBOARD_ROUTES: RouteNode[] = [
  {
    label: 'Pipeline', path: '#pipeline',
    children: [
      { label: 'Overview', path: '/dashboard', description: 'Stats, pipeline flow, cron status' },
      { label: 'Ingestion', path: '/dashboard/ingestion', description: 'Submit URL, logs, RSS, trust, API keys, flow' },
      { label: 'Review Queue', path: '/dashboard/review', description: 'Approve/reject ingested content' },
      { label: 'Translations', path: '/dashboard/translations', description: 'ES + VI translation status' },
    ],
  },
  {
    label: 'Content', path: '#content',
    children: [
      { label: 'Published', path: '/dashboard/content', description: 'All published content' },
      { label: 'Policies', path: '/dashboard/policies', description: 'Policy management' },
    ],
  },
  {
    label: 'Knowledge', path: '#knowledge',
    children: [
      { label: 'Library', path: '/dashboard/library', description: 'PDF upload, AI processing' },
      { label: 'Taxonomy', path: '/dashboard/taxonomy', description: 'Themes, focus areas, SDGs' },
      { label: 'Quotes', path: '/dashboard/quotes' },
      { label: 'Bookshelf', path: '/dashboard/bookshelf' },
    ],
  },
  {
    label: 'Visualizations', path: '#viz',
    children: [
      { label: 'Graph Views', path: '/dashboard/graphs' },
      { label: 'Graph Explorer', path: '/dashboard/graph-explorer' },
      { label: 'Coverage Map', path: '/dashboard/graph-coverage' },
      { label: 'Circle Graph', path: '/dashboard/circles' },
      { label: 'Fidelity Check', path: '/dashboard/fidelity' },
      { label: 'Engagement', path: '/dashboard/analytics' },
    ],
  },
  {
    label: 'Community', path: '#community-dash',
    children: [
      { label: 'Feedback Loop', path: '/dashboard/edits' },
      { label: 'Users', path: '/dashboard/users', description: 'Role management, approvals' },
      { label: 'Promotions', path: '/dashboard/promotions' },
      { label: 'LinkedIn', path: '/dashboard/linkedin' },
    ],
  },
  {
    label: 'Settings', path: '#settings',
    children: [
      { label: 'Content Preferences', path: '/dashboard/preferences' },
      { label: 'Utilities', path: '/dashboard/utilities' },
    ],
  },
  {
    label: 'Help', path: '#help',
    children: [
      { label: 'Tools & Guides', path: '/dashboard/tools-guides' },
      { label: 'User Manual', path: '/dashboard/manual' },
      { label: 'Sitemap & Wireframe', path: '/dashboard/sitemap' },
    ],
  },
  {
    label: 'Partner Portal', path: '#partner', description: 'Partner-only pages',
    children: [
      { label: 'Overview', path: '/dashboard/partner' },
      { label: 'Organization Profile', path: '/dashboard/partner/organization' },
      { label: 'My Guides', path: '/dashboard/partner/guides', children: [
        { label: 'New Guide', path: '/dashboard/partner/guides/new' },
        { label: 'Edit Guide', path: '/dashboard/partner/guides/[id]', dynamic: true },
      ]},
      { label: 'My Events', path: '/dashboard/partner/events', children: [
        { label: 'New Event', path: '/dashboard/partner/events/new' },
        { label: 'Edit Event', path: '/dashboard/partner/events/[id]', dynamic: true },
      ]},
    ],
  },
]

// ── Wireframe data ──

interface WireframeSection {
  label: string
  description: string
  diagram: string[]
}

const WIREFRAMES: WireframeSection[] = [
  {
    label: 'Public Page Layout',
    description: 'Every public page shares this shell from (exchange)/layout.tsx',
    diagram: [
      '┌─────────────────────────────────────────────────┐',
      '│  TickerTape  (election countdown, if upcoming)  │',
      '├─────────────────────────────────────────────────┤',
      '│  D2Nav  (logo, search, pathways menu, auth)     │',
      '├─────────────────────────────────────────────────┤',
      '│  Wayfinder  (breadcrumb + pathway context)      │',
      '├─────────────────────────────────────────────────┤',
      '│  NeighborhoodBar  (ZIP-based geo context)       │',
      '├─────────────────────────────────────────────────┤',
      '│  TranslateBar  (EN / ES / VI toggle)            │',
      '├─────────────────────────────────────────────────┤',
      '│                                                 │',
      '│              PAGE CONTENT                       │',
      '│           (children slot)                       │',
      '│                                                 │',
      '├─────────────────────────────────────────────────┤',
      '│  D2Footer  (links, pathways grid, copyright)    │',
      '├─────────────────────────────────────────────────┤',
      '│  OnboardingLoader  (first-visit ZIP prompt)     │',
      '│  ChanceChatWidget  (floating AI assistant)      │',
      '│  MobileBottomNav   (mobile tab bar)             │',
      '└─────────────────────────────────────────────────┘',
    ],
  },
  {
    label: 'Dashboard Layout',
    description: 'Auth-protected admin shell from dashboard/layout.tsx',
    diagram: [
      '┌──────────┬──────────────────────────────────────┐',
      '│          │  DashboardHeader                     │',
      '│          │  (user name, review badge)            │',
      '│  Sidebar ├──────────────────────────────────────┤',
      '│  (240px) │                                      │',
      '│          │  main content area                   │',
      '│  Logo    │  (p-8 padding)                       │',
      '│  Nav     │                                      │',
      '│  Groups  │  ┌──────────────────────────────┐    │',
      '│          │  │  Tab bar (if applicable)     │    │',
      '│  ─────── │  ├──────────────────────────────┤    │',
      '│  Pipeline│  │                              │    │',
      '│  Mini    │  │  Page-specific content       │    │',
      '│  Status  │  │                              │    │',
      '│          │  └──────────────────────────────┘    │',
      '│          │                                      │',
      '└──────────┴──────────────────────────────────────┘',
    ],
  },
  {
    label: 'Content Pipeline Flow',
    description: 'How content moves from source to published',
    diagram: [
      '  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐',
      '  │  URL / RSS / │───▶│   Scrape    │───▶│   Classify   │',
      '  │  CSV / API   │    │  (extract)  │    │  (16-dim AI) │',
      '  └─────────────┘    └─────────────┘    └──────┬───────┘',
      '                                               │        ',
      '                                               ▼        ',
      '                                        ┌──────────────┐',
      '                                        │    Inbox     │',
      '                                        │  (staged)    │',
      '                                        └──────┬───────┘',
      '                                    ┌──────────┴──────────┐',
      '                                    ▼                     ▼',
      '                             ┌────────────┐       ┌────────────┐',
      '                             │   Review   │       │   Auto-    │',
      '                             │   Queue    │       │  Publish   │',
      '                             │  (human)   │       │ (trusted)  │',
      '                             └─────┬──────┘       └─────┬──────┘',
      '                                   └──────────┬─────────┘',
      '                                              ▼          ',
      '                                       ┌────────────┐   ',
      '                                       │  Published │   ',
      '                                       │  + Translate│   ',
      '                                       │  (ES + VI) │   ',
      '                                       └────────────┘   ',
    ],
  },
  {
    label: 'Data Architecture',
    description: 'Core entity tables and how they connect',
    diagram: [
      '                    ┌─────────────────────┐               ',
      '                    │      TAXONOMY        │               ',
      '                    │  themes (7 pathways) │               ',
      '                    │  focus_areas (~50)    │               ',
      '                    │  sdgs (17)            │               ',
      '                    └──────────┬────────────┘               ',
      '                               │ junction tables            ',
      '     ┌──────────────┬──────────┼──────────┬──────────────┐ ',
      '     ▼              ▼          ▼          ▼              ▼ ',
      ' ┌─────────┐  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐',
      ' │ content_ │  │ elected_ │ │policies│ │services_ │ │  orgs   │',
      ' │published │  │officials │ │        │ │   211    │ │         │',
      ' └────┬────┘  └──────────┘ └────────┘ └──────────┘ └─────────┘',
      '      │                                                       ',
      '      ▼                                                       ',
      ' ┌──────────┐  ┌──────────────┐  ┌──────────────┐            ',
      ' │translate- │  │ kb_documents │  │    user_     │            ',
      ' │  ions     │  │ kb_chunks    │  │  profiles    │            ',
      ' └──────────┘  └──────────────┘  └──────────────┘            ',
    ],
  },
  {
    label: 'Newspaper Homepage (/home)',
    description: 'Editorial layout with multi-section design',
    diagram: [
      '┌─────────────────────────────────────────────────┐',
      '│          HERO  (masthead + date + tagline)      │',
      '├────────────────────────┬────────────────────────┤',
      '│                        │                        │',
      '│   LEAD STORY           │   SIDEBAR              │',
      '│   (featured content)   │   (civic brief,        │',
      '│                        │    election ticker,     │',
      '│                        │    trending)            │',
      '├────────────────────────┴────────────────────────┤',
      '│         NEWS GRID  (3-col content cards)        │',
      '├─────────────────────────────────────────────────┤',
      '│  PATHWAYS BAR  (7 pathway icon links)           │',
      '├─────────────────────────────────────────────────┤',
      '│  RESOURCES SHELF (services, orgs, officials)    │',
      '├─────────────────────────────────────────────────┤',
      '│  FROM THE LIBRARY  (KB document highlights)     │',
      '├─────────────────────────────────────────────────┤',
      '│  COMMUNITY  (neighborhoods, events, guides)     │',
      '└─────────────────────────────────────────────────┘',
    ],
  },
  {
    label: 'Roles & Access',
    description: 'Who sees what across the platform',
    diagram: [
      '  ┌─────────────────────────────────────────────────────────┐',
      '  │                  PUBLIC (no auth)                       │',
      '  │  All /exchange pages, search, officials, services,     │',
      '  │  library, pathways, elections, content                  │',
      '  └────────────────────────┬────────────────────────────────┘',
      '                           │ login                          ',
      '          ┌────────────────┼────────────────┐               ',
      '          ▼                ▼                ▼               ',
      '  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      ',
      '  │   Neighbor    │ │   Partner    │ │    Admin     │      ',
      '  │              │ │              │ │              │      ',
      '  │  /me          │ │  /partner    │ │  Full        │      ',
      '  │  /me/submit   │ │  /partner/*  │ │  dashboard   │      ',
      '  │  /me/settings │ │  guides +    │ │  access      │      ',
      '  │  Submit       │ │  events CRUD │ │              │      ',
      '  │  Library      │ │  Pipeline    │ │  Ingestion   │      ',
      '  │  Preferences  │ │  Graphs      │ │  Review      │      ',
      '  │              │ │  Library     │ │  Users       │      ',
      '  │              │ │  Preferences │ │  API Keys    │      ',
      '  └──────────────┘ └──────────────┘ └──────────────┘      ',
    ],
  },
]

// ── Components ──

function TreeNode({ node, depth = 0 }: { node: RouteNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1)
  const hasChildren = node.children && node.children.length > 0
  const isSection = node.path.startsWith('#')

  return (
    <div className={depth === 0 ? 'mb-1' : ''}>
      <div
        className={'flex items-center gap-1.5 py-1 px-2 rounded-md text-sm cursor-pointer hover:bg-brand-bg/80 transition-colors '
          + (isSection ? 'font-semibold text-brand-text' : 'text-brand-text/80')}
        style={{ paddingLeft: depth * 20 + 8 }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown size={14} className="text-brand-muted flex-shrink-0" /> : <ChevronRight size={14} className="text-brand-muted flex-shrink-0" />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        <span className={isSection ? 'text-brand-accent font-semibold' : ''}>{node.label}</span>
        {!isSection && (
          <code className="text-[11px] text-brand-muted bg-brand-bg px-1.5 py-0.5 rounded ml-1">{node.path}</code>
        )}
        {node.dynamic && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium ml-1">dynamic</span>
        )}
        {node.description && (
          <span className="text-xs text-brand-muted ml-auto hidden sm:inline">{node.description}</span>
        )}
      </div>
      {open && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function countRoutes(nodes: RouteNode[]): number {
  let count = 0
  for (const node of nodes) {
    if (!node.path.startsWith('#')) count++
    if (node.children) count += countRoutes(node.children)
  }
  return count
}

export function SitemapClient() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Sitemap')
  const [sitemapSection, setSitemapSection] = useState<'public' | 'dashboard'>('public')

  const publicCount = countRoutes(PUBLIC_ROUTES)
  const dashboardCount = countRoutes(DASHBOARD_ROUTES)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-text">Sitemap & Wireframe</h1>
        <p className="text-sm text-brand-muted mt-1">
          Complete route map and layout architecture for The Change Engine
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-brand-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-muted hover:text-brand-text hover:border-brand-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Sitemap Tab ── */}
      {activeTab === 'Sitemap' && (
        <div className="space-y-4">
          {/* Toggle public vs dashboard */}
          <div className="flex gap-2">
            <button
              onClick={() => setSitemapSection('public')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sitemapSection === 'public'
                  ? 'bg-brand-accent text-white'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
              }`}
            >
              <Globe size={14} />
              Public Site ({publicCount} routes)
            </button>
            <button
              onClick={() => setSitemapSection('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sitemapSection === 'dashboard'
                  ? 'bg-brand-accent text-white'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
              }`}
            >
              <Layout size={14} />
              Dashboard ({dashboardCount} routes)
            </button>
          </div>

          {/* Route tree */}
          <div className="bg-white rounded-xl border border-brand-border p-4">
            {(sitemapSection === 'public' ? PUBLIC_ROUTES : DASHBOARD_ROUTES).map((node) => (
              <TreeNode key={node.path} node={node} />
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-xs text-brand-muted">
            <span className="flex items-center gap-1.5">
              <code className="bg-brand-bg px-1.5 py-0.5 rounded">/path</code> Static route
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">dynamic</span> Parameterized route ([id], [slug])
            </span>
          </div>
        </div>
      )}

      {/* ── Wireframe Tab ── */}
      {activeTab === 'Wireframe' && (
        <div className="space-y-6">
          {WIREFRAMES.map((wf) => (
            <div key={wf.label} className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="px-5 py-3 border-b border-brand-border bg-brand-bg/50">
                <h3 className="font-semibold text-brand-text">{wf.label}</h3>
                <p className="text-xs text-brand-muted mt-0.5">{wf.description}</p>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-xs leading-relaxed font-mono text-brand-text/80 whitespace-pre">
                  {wf.diagram.join('\n')}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
