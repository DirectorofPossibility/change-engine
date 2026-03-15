'use client'

import { TopicPageLayout } from '@/components/exchange/templates/TopicPageLayout'
import { FilterTabs } from '@/components/exchange/templates/FilterTabs'
import { MagazineGrid } from '@/components/exchange/templates/MagazineGrid'
import { ArticleBody } from '@/components/exchange/templates/ArticleBody'
import { AuthorBio } from '@/components/exchange/templates/AuthorBio'
import { SidebarDefinitionBox } from '@/components/exchange/templates/SidebarDefinitionBox'
import { SidebarNewsletterBox } from '@/components/exchange/templates/SidebarNewsletterBox'
import { SidebarRelatedBox } from '@/components/exchange/templates/SidebarRelatedBox'
import { LoadMoreButton } from '@/components/exchange/templates/LoadMoreButton'
import Link from 'next/link'

/* ── SAMPLE DATA ── */

const SAMPLE_ARTICLES = [
  {
    id: '1',
    title: 'Houston\'s Health Network Is One of the Largest in the World',
    summary: 'The Texas Medical Center alone employs over 106,000 people. Here\'s how Houston residents can tap into this extraordinary resource.',
    imageUrl: '/images/editorial/health-fair.jpg',
    pathway: 'THEME_01',
    pathwayName: 'Health',
    pathwayColor: '#1a6b56',
    sourceDomain: 'houstonchronicle.com',
    publishedAt: '2026-03-12',
    href: '#',
  },
  {
    id: '2',
    title: 'New After-School Programs Launch Across HISD',
    summary: 'Twelve new community-based programs will serve 3,400 students starting this fall.',
    imageUrl: '/images/editorial/two-people-talking.jpg',
    pathway: 'THEME_02',
    pathwayName: 'Families',
    pathwayColor: '#1e4d7a',
    sourceDomain: 'hisd.org',
    publishedAt: '2026-03-10',
    href: '#',
  },
  {
    id: '3',
    title: 'Harris County Commissioners Court Approves Flood Bond',
    summary: 'The $2.5B bond will fund 181 projects across the county over the next decade.',
    imageUrl: '/images/editorial/town-hall.jpg',
    pathway: 'THEME_04',
    pathwayName: 'Voice',
    pathwayColor: '#7a2018',
    sourceDomain: 'hcfcd.org',
    publishedAt: '2026-03-08',
    href: '#',
  },
  {
    id: '4',
    title: 'Buffalo Bayou Cleanup Draws 400 Volunteers',
    summary: 'Community groups removed 2.3 tons of debris from a 4-mile stretch of the bayou.',
    imageUrl: '/images/editorial/cleanup.jpg',
    pathway: 'THEME_06',
    pathwayName: 'Planet',
    pathwayColor: '#1a5030',
    sourceDomain: 'buffalobayou.org',
    publishedAt: '2026-03-05',
    href: '#',
  },
]

const SAMPLE_CARDS = [
  { id: 'a', title: 'Free Tax Prep Sites Open Across Houston', pathway: 'THEME_05', pathwayName: 'Money', pathwayColor: '#6a4e10', sourceDomain: 'unitedwayhouston.org', href: '#' },
  { id: 'b', title: 'How to Register to Vote in Harris County', pathway: 'THEME_04', pathwayName: 'Voice', pathwayColor: '#7a2018', sourceDomain: 'harrisvotes.com', href: '#' },
  { id: 'c', title: 'Community Gardens Accepting Spring Applications', pathway: 'THEME_06', pathwayName: 'Planet', pathwayColor: '#1a5030', sourceDomain: 'urbanharvest.org', href: '#' },
  { id: 'd', title: 'Mental Health Resources for Teens in Greater Houston', pathway: 'THEME_01', pathwayName: 'Health', pathwayColor: '#1a6b56', sourceDomain: 'mentalhealth.gov', href: '#' },
  { id: 'e', title: 'Houston Food Bank Expands Saturday Distribution', pathway: 'THEME_01', pathwayName: 'Health', pathwayColor: '#1a6b56', sourceDomain: 'houstonfoodbank.org', href: '#' },
  { id: 'f', title: 'Super Neighborhood Council Elections This Month', pathway: 'THEME_03', pathwayName: 'Neighborhood', pathwayColor: '#4a2870', sourceDomain: 'houstontx.gov', href: '#' },
]

export default function DesignPreviewPage() {
  return (
    <div>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1: TOPIC PAGE LAYOUT
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <TopicPageLayout
        title="Health"
        eyebrow="Pathway"
        description="Houston's health network is one of the largest in the world. The Texas Medical Center, community clinics, mental health services, and food access programs serve millions of residents every year."
        color="#1a6b56"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Pathways', href: '/pathways' },
          { label: 'Health' },
        ]}
        stats={[
          { value: 2847, label: 'resources' },
          { value: 412, label: 'organizations' },
          { value: 89, label: 'services' },
        ]}
        sidebar={
          <>
            <SidebarDefinitionBox
              title="Health"
              color="#1a6b56"
              sections={[
                {
                  question: 'What does this pathway cover?',
                  answer: 'Physical health, mental health, food access, substance use support, maternal care, and disability services across Greater Houston.',
                  link: { href: '#', label: 'Explore focus areas' },
                },
                {
                  question: 'Why does it matter?',
                  answer: 'Houston is home to the largest medical center in the world, yet health access remains uneven across neighborhoods.',
                },
                {
                  question: 'How can I get involved?',
                  answer: 'Volunteer at a community health fair, connect a neighbor with free clinics, or attend a public health meeting.',
                  link: { href: '/opportunities', label: 'Find opportunities' },
                },
              ]}
            />

            <SidebarRelatedBox
              title="Related Resources"
              accentColor="#1a6b56"
              seeAllHref="/services"
              seeAllLabel="Browse all services"
              items={[
                { title: 'Community Health Assessment Quiz', type: 'Quiz', href: '#' },
                { title: 'Finding Free Clinics Near You', type: 'Guide', href: '#' },
                { title: 'Mental Health First Aid Training', type: 'Course', href: '#', meta: '4 weeks' },
              ]}
            />

            <SidebarNewsletterBox
              title="Health Updates"
              description="Get weekly health resources, clinic openings, and community health events in your inbox."
              accentColor="#1a6b56"
            />
          </>
        }
      >
        {/* ── FILTER TABS ── */}
        <FilterTabs
          accentColor="#1a6b56"
          tabs={[
            {
              key: 'recent',
              label: 'Most Recent',
              content: (
                <div className="space-y-4">
                  {SAMPLE_CARDS.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex gap-4 p-4 bg-white border border-rule hover:border-ink transition-colors group"
                    >
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden" style={{ background: item.pathwayColor + '15' }}>
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="w-3 h-3" style={{ background: item.pathwayColor }} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: item.pathwayColor }}>
                          {item.pathwayName}
                        </p>
                        <h3 className="text-[15px] font-bold text-ink leading-snug group-hover:text-blue transition-colors">
                          {item.title}
                        </h3>
                        <span className="text-[12px] text-faint mt-1 block">{item.sourceDomain}</span>
                      </div>
                    </Link>
                  ))}
                  <LoadMoreButton onClick={() => {}} />
                </div>
              ),
            },
            {
              key: 'popular',
              label: 'Most Popular',
              content: (
                <div className="space-y-4">
                  {[...SAMPLE_CARDS].reverse().map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex gap-4 p-4 bg-white border border-rule hover:border-ink transition-colors group"
                    >
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden" style={{ background: item.pathwayColor + '15' }}>
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="w-3 h-3" style={{ background: item.pathwayColor }} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: item.pathwayColor }}>
                          {item.pathwayName}
                        </p>
                        <h3 className="text-[15px] font-bold text-ink leading-snug group-hover:text-blue transition-colors">
                          {item.title}
                        </h3>
                        <span className="text-[12px] text-faint mt-1 block">{item.sourceDomain}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </TopicPageLayout>

      {/* ── DIVIDER ── */}
      <div className="border-t-4 border-ink" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2: MAGAZINE GRID
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold" style={{ color: '#0d1117' }}>What&apos;s New</h2>
              <p className="text-[14px] mt-1" style={{ color: '#5c6474' }}>Recently published for the Houston community</p>
            </div>
            <Link href="/news" className="text-[14px] font-semibold" style={{ color: '#C75B2A' }}>
              See all &rarr;
            </Link>
          </div>

          <MagazineGrid items={SAMPLE_ARTICLES} />
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t-4 border-ink" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3: ARTICLE DETAIL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            {/* Main article */}
            <div>
              {/* Article header */}
              <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#1a6b56' }}>
                Health
              </p>
              <h1 className="font-display text-3xl font-bold text-ink leading-tight mb-3">
                Houston&apos;s Health Network Is One of the Largest in the World
              </h1>
              <div className="flex items-center gap-3 text-[13px] text-faint mb-6">
                <span>March 12, 2026</span>
                <span>&middot;</span>
                <span>5 min read</span>
              </div>

              {/* Hero image */}
              <div className="w-full h-[360px] bg-paper mb-8 flex items-center justify-center border border-rule overflow-hidden">
                <img src="/images/editorial/health-fair.jpg" alt="" className="w-full h-full object-cover" />
              </div>

              {/* Article body */}
              <ArticleBody>
                <p>
                  The Texas Medical Center is the largest medical complex in the world, spanning 1,345 acres
                  and employing over 106,000 people. But Houston&apos;s health network extends far beyond TMC —
                  community health centers, free clinics, mobile health units, and mutual aid networks reach
                  every corner of the metro area.
                </p>

                <h2>Community Health Centers</h2>
                <p>
                  Federally qualified health centers (FQHCs) serve patients regardless of ability to pay.
                  Houston has 32 FQHCs with over 100 locations, providing primary care, dental, behavioral health,
                  and pharmacy services to 800,000+ patients annually.
                </p>

                <blockquote>
                  &quot;Health care is a community endeavor. When we invest in neighborhood clinics,
                  we invest in the whole city.&quot; — Dr. Maria Santos, Harris Health System
                </blockquote>

                <h2>Mental Health Resources</h2>
                <p>
                  The Harris Center for Mental Health and IDD serves as the local mental health authority,
                  providing crisis intervention, outpatient therapy, substance use treatment, and intellectual
                  disability services. Their 24/7 crisis line connects residents with immediate support.
                </p>

                <ul>
                  <li>Harris Center Crisis Line: 713-970-7000</li>
                  <li>SAMHSA National Helpline: 1-800-662-4357</li>
                  <li>Crisis Text Line: Text HOME to 741741</li>
                </ul>

                <h3>Free and Sliding-Scale Clinics</h3>
                <p>
                  Over 60 free or reduced-cost clinics operate in Greater Houston, many run by faith-based
                  organizations and community nonprofits. These clinics fill critical gaps for uninsured
                  and underinsured residents.
                </p>

                <hr />

                <p>
                  <strong>Want to find health resources near you?</strong> Use the{' '}
                  <a href="/services">Change Engine service finder</a> to locate clinics,
                  food pantries, and mental health support in your neighborhood.
                </p>
              </ArticleBody>

              {/* Author bio */}
              <div className="mt-8">
                <AuthorBio
                  name="Houston Chronicle"
                  bio="Houston's leading daily newspaper, covering local news, politics, health, education, and culture since 1901."
                  institution="Hearst Newspapers"
                  href="#"
                />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <SidebarDefinitionBox
                title="Health"
                color="#1a6b56"
                sections={[
                  {
                    question: 'What does this cover?',
                    answer: 'Physical health, mental health, food access, and community wellness resources in Greater Houston.',
                  },
                  {
                    question: 'How can I help?',
                    answer: 'Volunteer at a health fair, donate to free clinics, or share these resources with a neighbor.',
                    link: { href: '/opportunities', label: 'Find opportunities' },
                  },
                ]}
              />

              <SidebarRelatedBox
                title="You May Also Enjoy"
                accentColor="#1a6b56"
                items={[
                  { title: 'Free Dental Clinics in Harris County', type: 'Article', href: '#', meta: 'Mar 8, 2026' },
                  { title: 'How to Apply for SNAP Benefits', type: 'Guide', href: '#', meta: 'Feb 28, 2026' },
                  { title: 'Community Health Assessment Quiz', type: 'Quiz', href: '#' },
                ]}
              />

              <SidebarNewsletterBox accentColor="#1a6b56" />
            </aside>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t-4 border-ink" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4: ALL COMPONENTS AT A GLANCE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#f4f5f7' }}>
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-2">Template Components</h2>
          <p className="text-[14px] text-muted mb-8">Inspired by Greater Good Magazine&apos;s editorial design patterns</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'TopicPageLayout', desc: 'Topic header + 2-column body + sidebar', used: 'Pathway pages, category pages' },
              { name: 'FilterTabs', desc: 'Recent / Popular toggle tabs', used: 'Any listing with sort modes' },
              { name: 'MagazineGrid', desc: 'Featured card + stacked sidebar cards', used: 'Homepage, news page' },
              { name: 'ArticleBody', desc: 'Prose typography (17px, 1.7 line-height)', used: 'Content detail, library docs' },
              { name: 'AuthorBio', desc: 'Avatar + name + institution + bio', used: 'Content detail, entity pages' },
              { name: 'SidebarDefinitionBox', desc: 'Q&A explainer with accent color', used: 'Pathway sidebars' },
              { name: 'SidebarRelatedBox', desc: 'Related articles / quizzes / videos', used: 'All sidebars' },
              { name: 'SidebarNewsletterBox', desc: 'Email signup with accent color', used: 'All sidebars' },
              { name: 'LoadMoreButton', desc: 'AJAX-style "Load More" pagination', used: 'All listing pages' },
            ].map((c) => (
              <div key={c.name} className="bg-white border border-rule p-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-blue font-bold mb-1">{c.name}</h3>
                <p className="text-[13px] text-ink leading-snug mb-2">{c.desc}</p>
                <p className="text-[11px] text-faint">{c.used}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
