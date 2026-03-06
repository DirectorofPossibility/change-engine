/**
 * @fileoverview Users Manual for the Community Exchange platform.
 *
 * A guide for Neighbors and Partners explaining how to use the platform,
 * create a profile, contribute content, and participate in the civic
 * knowledge graph. Lives in the pipeline admin dashboard.
 *
 * Role-aware: shows content relevant to the viewer's level (neighbor,
 * partner, or admin).
 *
 * @route GET /dashboard/manual
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Users Manual — Dashboard',
  description: 'A guide for Neighbors and Partners on how to use The Change Engine platform.',
}

const PATHWAY_COLORS: Record<string, { color: string; sub: string }> = {
  Health: { color: '#D4654A', sub: 'Wellness, healing, and care' },
  Families: { color: '#C4943C', sub: 'Education, safety, strong foundations' },
  Neighborhood: { color: '#7B6BA8', sub: 'Housing, safety, places we share' },
  Voice: { color: '#3D7A7A', sub: 'Civic power, voting, participation' },
  Money: { color: '#4A7A8A', sub: 'Jobs, financial health, opportunity' },
  Planet: { color: '#5A8E5A', sub: 'Climate, environment, sustainability' },
  'The Bigger We': { color: '#8B6BA8', sub: 'Bridging difference, building together' },
}

const CENTER_INFO = [
  { name: 'Learning', question: 'How can I understand?', color: '#4C9F38', description: 'Articles, explainers, and learning paths that build understanding around civic topics.' },
  { name: 'Action', question: 'How can I help?', color: '#DD1367', description: 'Volunteer opportunities, events, and ways to take meaningful action in your community.' },
  { name: 'Resource', question: "What's available to me?", color: '#26BDE2', description: 'Services, organizations, and programs that support your well-being and goals.' },
  { name: 'Accountability', question: 'Who makes decisions?', color: '#8B6BA8', description: 'Elected officials, policies, and civic processes that shape your community.' },
]

function TOCLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
        {children}
      </a>
    </li>
  )
}

function SectionHeading({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="text-xl font-bold text-gray-900 mt-14 mb-3 pb-2 border-b border-gray-200 scroll-mt-24">
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-gray-800 mt-6 mb-2">
      {children}
    </h3>
  )
}

function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{title}</h4>
        <p className="text-gray-600 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

export default async function ManualPage() {
  const supabase = await createClient()
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

  const isAdmin = role === 'admin'
  const isPartner = role === 'partner'
  const isNeighbor = role === 'neighbor'

  // Build TOC based on role
  const tocItems: { href: string; label: string }[] = [
    { href: '#overview', label: 'What is the Community Exchange?' },
    { href: '#pathways', label: 'The Seven Pathways' },
    { href: '#centers', label: 'Four Centers' },
    { href: '#roles', label: 'Neighbors & Partners' },
    { href: '#getting-started', label: 'Getting Started' },
  ]

  if (isNeighbor || isAdmin) {
    tocItems.push({ href: '#neighbor-guide', label: 'Neighbor Guide' })
    tocItems.push({ href: '#neighbor-tools', label: 'Neighbor Tools' })
  }
  if (isPartner || isAdmin) {
    tocItems.push({ href: '#partner-guide', label: 'Partner Guide' })
    tocItems.push({ href: '#partner-tools', label: 'Partner Tools' })
  }

  tocItems.push(
    { href: '#content-pipeline', label: 'How Content Works' },
    { href: '#wayfinder', label: 'Using the Wayfinder' },
    { href: '#languages', label: 'Languages' },
  )

  if (isAdmin) {
    tocItems.push({ href: '#admin-users', label: 'Admin: Managing Roles' })
  }

  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users Manual</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin
            ? 'Complete guide for all roles — Neighbors, Partners, and Admins.'
            : isPartner
              ? 'Your guide to managing content and representing your organization on the Community Exchange.'
              : 'Your guide to exploring and contributing to the Community Exchange.'
          }
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-8">
        {/* Main Content */}
        <div className="space-y-0">

          {/* -- Overview -- */}
          <SectionHeading id="overview">What is the Community Exchange?</SectionHeading>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            The Community Exchange is a civic platform built for Houston. It brings together articles, services, organizations, elected officials, policies, and community opportunities into one place — organized around the topics that matter most to daily life.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Every piece of content is mapped onto a <strong>knowledge graph</strong> — a web of connections between pathways, focus areas, global goals, and social determinants of health. When you explore one topic, you can see how it connects to everything else.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            All content is written at an accessible reading level and available in <strong>English</strong>, <strong>Spanish</strong>, and <strong>Vietnamese</strong>.
          </p>

          {/* -- The Seven Pathways -- */}
          <SectionHeading id="pathways">The Seven Pathways</SectionHeading>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Everything in the Community Exchange is organized around seven pathways of civic life. Each one connects to the others through shared focus areas, officials, and policies.
          </p>
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            {Object.entries(PATHWAY_COLORS).map(([name, { color, sub }]) => (
              <div key={name} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ border: `2.5px solid ${color}` }} />
                <div>
                  <span className="text-sm font-medium text-gray-800">{name}</span>
                  <span className="text-xs text-gray-400 ml-2">{sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* -- Four Centers -- */}
          <SectionHeading id="centers">Four Centers of Inquiry</SectionHeading>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Within each pathway, content is organized by what you are looking for. Each center answers a different question.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {CENTER_INFO.map((c) => (
              <div key={c.name} className="rounded-lg border border-gray-200 bg-white p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-semibold text-sm text-gray-900">{c.name}</span>
                </div>
                <p className="text-xs italic text-gray-400 mb-1.5">{c.question}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>

          {/* -- Roles -- */}
          <SectionHeading id="roles">Neighbors &amp; Partners</SectionHeading>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            The Community Exchange is built by and for the community. There are two ways to participate beyond browsing.
          </p>

          <div className="space-y-4">
            {/* Neighbor */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-3 bg-teal-50 border-b border-teal-100">
                <h3 className="font-bold text-gray-900">Neighbor</h3>
                <p className="text-xs text-gray-500">Community contributor</p>
              </div>
              <div className="px-5 py-4 text-sm text-gray-600 leading-relaxed space-y-2">
                <p>
                  <strong>Neighbors</strong> are community members who go beyond browsing. As a Neighbor, you can create a profile, track your learning journey, earn badges for civic engagement, and suggest content for the platform.
                </p>
                <p>
                  Every Neighbor starts as a regular member and can be elevated by the community team. Your contributions — from suggesting edits to sharing local knowledge — help make the platform better for everyone.
                </p>
              </div>
            </div>

            {/* Partner */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
                <h3 className="font-bold text-gray-900">Partner</h3>
                <p className="text-xs text-gray-500">Organization representative</p>
              </div>
              <div className="px-5 py-4 text-sm text-gray-600 leading-relaxed space-y-2">
                <p>
                  <strong>Partners</strong> represent community organizations — nonprofits, civic groups, government agencies, and service providers. Partners have their own portal where they can create guides, post events, and manage their organization&apos;s presence.
                </p>
                <p>
                  Partner content goes through a review process before publishing, ensuring quality and accuracy. Once approved, your guides and events appear across the platform, connected to the relevant pathways and focus areas.
                </p>
              </div>
            </div>
          </div>

          {/* -- Getting Started -- */}
          <SectionHeading id="getting-started">Getting Started</SectionHeading>
          <div className="space-y-5">
            <StepCard number={1} title="Create your account">
              Visit the <strong>Sign Up</strong> page and enter your name, email, and a password. You can optionally add your ZIP code (to see neighborhood-specific content) and choose your preferred language.
            </StepCard>
            <StepCard number={2} title="Explore the Wayfinder">
              The homepage features the <strong>Wayfinder</strong> — an interactive circle visualization of all seven pathways. Click any circle to explore its resources, or use the search bar to find specific topics.
            </StepCard>
            <StepCard number={3} title="Track your journey">
              Your personal dashboard at <strong>/me</strong> shows your learning progress, earned badges, and civic impact points. Every article you read, action you take, and resource you access contributes to your journey.
            </StepCard>
            <StepCard number={4} title="Contribute">
              As your engagement grows, you can suggest content, share local knowledge, and help shape the platform for your community.
            </StepCard>
          </div>

          {/* -- Neighbor Guide (shown to neighbors and admins) -- */}
          {(isNeighbor || isAdmin) && (
            <>
              <SectionHeading id="neighbor-guide">Neighbor Guide</SectionHeading>

              <SubHeading>Your Profile</SubHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Your profile captures your interests, preferred language, and neighborhood. This helps the platform surface the most relevant content for you. Update your profile anytime from <strong>Settings</strong>.
              </p>

              <SubHeading>Learning Paths</SubHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Learning paths are curated sequences of articles and resources that build understanding around a civic topic — like understanding local government, navigating healthcare options, or exploring climate resilience. Your progress is tracked automatically, and you earn badges as you complete modules.
              </p>

              <SubHeading>Badges &amp; Impact Points</SubHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Every meaningful action earns impact points — completing a learning module, attending an event, using a resource, or volunteering. Points accumulate into badges that reflect your civic engagement.
              </p>

              <SubHeading>Suggesting Content</SubHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Every published item has a <strong>&ldquo;Suggest an edit&rdquo;</strong> option. You can flag outdated information, suggest new resources, or share local knowledge that the community team can review and incorporate.
              </p>

              {/* Neighbor Tools Section */}
              <SectionHeading id="neighbor-tools">Your Neighbor Tools</SectionHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                As a Neighbor, you have access to these tools in your dashboard. Visit <a href="/dashboard/tools-guides" className="text-blue-600 hover:underline font-medium">Tools &amp; Guides</a> to see the full list.
              </p>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Submit Content via URL</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Found an article, resource, or event that would be valuable to the community? Paste the URL and our team will review it, classify it on the knowledge graph, and publish it if approved.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Knowledge Base</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Browse the full library of published content — articles, services, guides, learning paths — organized by pathway, center, and focus area. Add items to the library and curate collections.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Users Manual</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    You are reading it now. This guide explains how the platform works, how content is organized, and how you can contribute.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 italic">
                All neighbor-submitted content requires review before publication.
              </p>
            </>
          )}

          {/* -- Partner Guide (shown to partners and admins) -- */}
          {(isPartner || isAdmin) && (
            <>
              <SectionHeading id="partner-guide">Partner Guide</SectionHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Partners have access to the <strong>Partner Portal</strong> — a dedicated dashboard for managing your organization&apos;s content.
              </p>

              <SubHeading>Becoming a Partner</SubHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Create an account and contact the Change Engine team. Once your organization is verified, an admin will assign you the Partner role and link your account to your organization. You will then see the Partner Portal in your dashboard.
              </p>

              <SubHeading>Creating Guides</SubHeading>
              <div className="rounded-lg border border-gray-200 bg-white p-4 mb-3">
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  Guides are educational content pieces your organization creates for the community:
                </p>
                <ol className="text-sm text-gray-600 leading-relaxed space-y-1.5 list-decimal list-inside">
                  <li>Navigate to <strong>My Guides</strong> in the Partner Portal</li>
                  <li>Click <strong>Create New Guide</strong></li>
                  <li>Add a title, description, and guide content (supports rich text)</li>
                  <li>Select the relevant pathway and focus areas</li>
                  <li>Optionally add a hero image</li>
                  <li>Submit for review</li>
                </ol>
                <p className="text-xs text-gray-400 mt-2 italic">
                  All guides start in &ldquo;pending review&rdquo; status. The community team reviews and publishes approved guides within a few business days.
                </p>
              </div>

              <SubHeading>Posting Events &amp; Opportunities</SubHeading>
              <div className="rounded-lg border border-gray-200 bg-white p-4 mb-3">
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  Share volunteer opportunities, community events, and programs:
                </p>
                <ol className="text-sm text-gray-600 leading-relaxed space-y-1.5 list-decimal list-inside">
                  <li>Go to <strong>My Events</strong> in the Partner Portal</li>
                  <li>Click <strong>Create New Event</strong></li>
                  <li>Fill in event details — name, description, dates, location</li>
                  <li>Mark whether it is virtual or in-person</li>
                  <li>Add a registration link and available spots (if applicable)</li>
                  <li>Submit for review</li>
                </ol>
              </div>

              <SubHeading>Review Status</SubHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Your Partner Portal dashboard shows the status of all submitted content:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                  Pending — Under review
                </span>
                <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  Approved — Live on site
                </span>
                <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  Needs Revision — See feedback
                </span>
              </div>

              {/* Partner Tools Section */}
              <SectionHeading id="partner-tools">Your Partner Tools</SectionHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                As a Partner, you have access to an expanded set of tools. Visit <a href="/dashboard/tools-guides" className="text-blue-600 hover:underline font-medium">Tools &amp; Guides</a> to see the full list.
              </p>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Submit Content (URL, API, RSS)</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Partners can submit content via URL, connect RSS feeds for automatic ingestion, and use the API for programmatic content submission. All submissions go through the review pipeline.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Create Guides &amp; Events</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Write educational guides and post community events on behalf of your organization. Content is mapped onto the knowledge graph and connected to relevant pathways.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Graph Visualizations</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Explore how your organization's content connects across the knowledge graph. View the circle graph, coverage heatmap, and force-directed explorer.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Pipeline &amp; Ingestion</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Manage your content pipeline — submit via API keys, configure RSS feeds, and track ingestion status across all your submissions.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Knowledge Base</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Browse and contribute to the full library of published content. See how your organization's resources connect to the broader community knowledge graph.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 italic">
                All partner-submitted content requires review before publication.
              </p>
            </>
          )}

          {/* -- Content Pipeline -- */}
          <SectionHeading id="content-pipeline">How Content Works</SectionHeading>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            All content goes through a careful pipeline to ensure quality, accessibility, and accurate classification.
          </p>

          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            {[
              { n: 1, label: 'Ingestion', desc: 'Content arrives from RSS feeds, partner submissions, community suggestions, or direct entry.', bg: 'bg-blue-100', fg: 'text-blue-700' },
              { n: 2, label: 'Classification', desc: 'AI maps each item onto the knowledge graph — assigning pathways, focus areas, SDGs, social determinants, and a 6th-grade-level rewrite.', bg: 'bg-purple-100', fg: 'text-purple-700' },
              { n: 3, label: 'Review', desc: 'Community team reviews every item for accuracy, tone, and relevance before it goes live.', bg: 'bg-yellow-100', fg: 'text-yellow-700' },
              { n: 4, label: 'Publication', desc: 'Approved content is published and becomes available in the Wayfinder, search, and pathway pages.', bg: 'bg-green-100', fg: 'text-green-700' },
              { n: 5, label: 'Translation', desc: "Published content is translated into Spanish and Vietnamese so it is accessible to more of Houston's community.", bg: 'bg-teal-100', fg: 'text-teal-700' },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full ${step.bg} ${step.fg} flex items-center justify-center text-xs font-bold flex-shrink-0`}>{step.n}</div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{step.label}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* -- Wayfinder -- */}
          <SectionHeading id="wayfinder">Using the Wayfinder</SectionHeading>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            The <strong>Wayfinder</strong> is the heart of the Community Exchange homepage. It displays the seven pathways as interactive circles, with bridge lines showing how many resources connect between them.
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm text-gray-600">
            <p><strong>Click a pathway circle</strong> to see its resources, focus areas, connected officials, and related services.</p>
            <p><strong>Use the sidebar</strong> to filter by center (Learning, Action, Resource, Accountability) or search for specific topics.</p>
            <p><strong>Enter your ZIP code</strong> to see content personalized to your neighborhood.</p>
            <p><strong>Switch languages</strong> using the language selector in the header — English, Spanish, and Vietnamese.</p>
          </div>

          {/* -- Languages -- */}
          <SectionHeading id="languages">Languages</SectionHeading>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            The Community Exchange is available in three languages:
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
              <p className="font-semibold text-gray-900 text-sm">English</p>
              <p className="text-xs text-gray-400">Default</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
              <p className="font-semibold text-gray-900 text-sm">Espa&ntilde;ol</p>
              <p className="text-xs text-gray-400">Spanish</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
              <p className="font-semibold text-gray-900 text-sm">Ti&#7871;ng Vi&#7879;t</p>
              <p className="text-xs text-gray-400">Vietnamese</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Use the language toggle in the site header to switch. Your preference is saved automatically.
          </p>

          {/* -- Admin: Managing Users (admin only) -- */}
          {isAdmin && (
            <>
              <SectionHeading id="admin-users">Admin: Managing Users &amp; Roles</SectionHeading>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Admins can manage user roles from the <strong>Users</strong> page in the pipeline dashboard.
              </p>

              <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900">Promoting a Neighbor</p>
                  <p className="text-xs text-gray-500">Find the user in the Users list and click <strong>Make Neighbor</strong>. This elevates them from the default &ldquo;user&rdquo; role to &ldquo;neighbor,&rdquo; enabling contribution features.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Assigning a Partner</p>
                  <p className="text-xs text-gray-500">Click <strong>Assign Partner</strong>, select the organization from the dropdown, and confirm. The user gets partner access and can manage content for that organization.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Revoking Roles</p>
                  <p className="text-xs text-gray-500">Click <strong>Revoke Role</strong> to return an elevated user to the default &ldquo;user&rdquo; role. Their submitted content remains but they lose portal access.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Managing Tools &amp; Guides</p>
                  <p className="text-xs text-gray-500">Use the <strong>Tools &amp; Guides</strong> page in the admin sidebar to control which tools and guides appear for neighbors and partners. Toggle items on or off and assign them to specific levels.</p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Sticky TOC Sidebar */}
        <nav className="hidden lg:block">
          <div className="sticky top-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">On this page</p>
            <ul className="space-y-1.5 border-l border-gray-200 pl-3">
              {tocItems.map((item) => (
                <TOCLink key={item.href} href={item.href}>{item.label}</TOCLink>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  )
}
