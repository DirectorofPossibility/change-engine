import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'User Manual — Change Engine',
  description: 'How Change Engine works. Start anywhere. The platform will show you what connects.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const sections = [
  {
    title: 'Start with your address',
    paragraphs: [
      'The fastest way in is your address. Type it into Civic Compass and we\u2019ll show you every elected official who represents you \u2014 city council, county commissioner, state rep, state senator, U.S. representative, U.S. senator.',
      'All of them. One place. Right now.',
    ],
  },
  {
    title: 'Browse by what matters to you',
    paragraphs: [
      'Not sure where to start? Pick a pathway. Seven themes \u2014 housing, health, education, environment, economy, safety, civic life. Pick the one that\u2019s closest to what you care about.',
      'Inside each pathway: organizations working on it, services available for it, news about it, officials responsible for it.',
    ],
  },
  {
    title: 'Search for anything',
    paragraphs: [
      'Use the search bar. A name, a place, an issue, an organization. Use the tabs to filter by type. Everything updates daily.',
    ],
  },
  {
    title: 'Submit a URL with multiple events or articles',
    paragraphs: [
      'Found a page that lists several events or news stories? Just submit the URL once. The platform will automatically detect multiple items on the page and split them into separate entries \u2014 each with its own title, date, and classification.',
      'This works for event calendars, news roundups, newsletters, and listing pages. Each extracted item goes to the review queue individually.',
    ],
  },
  {
    title: 'Follow what\u2019s happening',
    paragraphs: [
      'The news feed pulls from RSS sources, official government feeds, and community submissions \u2014 updated daily. Everything is rewritten at a 6th-grade reading level so it\u2019s accessible to everyone.',
      'Three Good Things on the splash page shows positive stories shared by neighbors across Houston.',
    ],
  },
  {
    title: 'Find your elected officials',
    paragraphs: [
      'Enter your address or ZIP code in the Civic Compass. We cover every level: Houston City Council, Harris County Commissioners Court, Texas state legislators, and your U.S. representatives and senators.',
      'Each official\u2019s page shows their contact info, committees, recent legislation, and which pathways their work touches.',
    ],
  },
  {
    title: 'Services and organizations',
    paragraphs: [
      'The platform includes 211 services, nonprofit organizations, and government agencies serving the Houston area. Browse by category, search by name, or find them through the pathways.',
      'Every service and organization is mapped to the same knowledge graph as news and officials \u2014 so you can see how they connect.',
    ],
  },
  {
    title: 'Elections and polling places',
    paragraphs: [
      'Check upcoming elections, find your polling place, and see who\u2019s on the ballot \u2014 all in one place. Election data syncs from the Texas Secretary of State and FEC.',
    ],
  },
  {
    title: 'Save what matters',
    paragraphs: [
      'Create a free account to save officials, organizations, and articles. Set your language. Get notified about things in your area.',
      'You don\u2019t need an account to browse. But it helps if you want to keep track.',
    ],
  },
  {
    title: 'Languages',
    paragraphs: [
      'English, Spanish, and Vietnamese. Switch in the top navigation or in your settings.',
      'All content is translated by AI and reviewed for accuracy. Translations run nightly for newly published content.',
    ],
  },
  {
    title: 'The Knowledge Graph',
    paragraphs: [
      'Everything in the platform is connected through a knowledge graph. Each article, service, official, and organization is classified across 16 dimensions \u2014 pathways, focus areas, SDGs, social determinants of health, and more.',
      'This means when you look at one thing, you can see everything related to it. An article about housing connects to the housing pathway, the officials responsible for housing policy, the organizations providing housing services, and the federal grants funding them.',
    ],
  },
  {
    title: 'Tips and shortcuts',
    paragraphs: [
      'Use the search bar in the header for quick autocomplete results across all content types.',
      'The Civic Compass accepts addresses, ZIP codes, or neighborhood names.',
      'On any official\u2019s page, you\u2019ll find direct contact info and links to their official sites.',
      'Content with a green badge has been translated into all three languages.',
      'Pages with multiple events on a single URL? Submit the URL once \u2014 the system splits them automatically.',
    ],
  },
]

const VISIBLE_COUNT = 4

export default function ManualPage() {
  const visible = sections.slice(0, VISIBLE_COUNT)
  const rest = sections.slice(VISIBLE_COUNT)

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 text-center">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs uppercase tracking-widest mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl mb-4">
            How Change Engine works.
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg max-w-xl mx-auto leading-relaxed">
            Start anywhere. The platform will show you what connects.
          </p>
          <p style={{ color: MUTED }} className="text-sm mt-4">
            You don't need a guide to use this. But here's one anyway.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: INK }}>Manual</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Chapters</h2>
          <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2">
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{sections.length} sections</span>
          </div>
        </div>

        {visible.map(function (section, i) {
          return (
            <section key={i} className="mb-10">
              <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-4">
                {section.title}
              </h2>
              <div className="space-y-4" style={{ color: MUTED }}>
                {section.paragraphs.map(function (p, j) {
                  return <p key={j} className="leading-relaxed">{p}</p>
                })}
              </div>
              <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="mt-8" />
            </section>
          )
        })}

        {rest.length > 0 && (
          <details>
            <summary style={{ fontFamily: MONO, color: CLAY }} className="text-xs cursor-pointer hover:underline py-2 mb-6">
              Show {rest.length} more sections
            </summary>
            {rest.map(function (section, i) {
              return (
                <section key={i} className="mb-10">
                  <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-4">
                    {section.title}
                  </h2>
                  <div className="space-y-4" style={{ color: MUTED }}>
                    {section.paragraphs.map(function (p, j) {
                      return <p key={j} className="leading-relaxed">{p}</p>
                    })}
                  </div>
                  <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="mt-8" />
                </section>
              )
            })}
          </details>
        )}

        {/* Closing */}
        <section className="p-6 border" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
          <p style={{ color: MUTED }} className="leading-relaxed">
            That&rsquo;s it. Start with what you know. The platform shows you the rest.
          </p>
          <p style={{ color: MUTED }} className="mt-3">
            Questions? Reach us at{' '}
            <a href="mailto:hello@thechangelab.net" style={{ color: CLAY }} className="hover:underline font-medium">
              hello@thechangelab.net
            </a>
            .
          </p>
        </section>

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-10" />

        {/* Footer */}
        <div className="text-center">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-xs hover:underline">
            Back to Change Engine
          </Link>
        </div>
      </div>
    </div>
  )
}
