import type { Metadata } from 'next'
import { PageHero } from '@/components/exchange/PageHero'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'User Manual — Community Exchange',
  description: 'How Community Exchange works. Start anywhere. The platform will show you what connects.',
}

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

export default function ManualPage() {
  return (
    <div>
      <PageHero
        variant="editorial"
        title="How Community Exchange works."
        subtitle="Start anywhere. The platform will show you what connects."
        intro="You don't need a guide to use this. But here's one anyway."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {sections.map(function (section, i) {
          return (
            <section key={i} className="mb-10">
              <h2 className="text-title font-bold text-brand-text mb-4">
                {section.title}
              </h2>
              <div className="space-y-4 text-brand-muted leading-relaxed">
                {section.paragraphs.map(function (p, j) {
                  return <p key={j}>{p}</p>
                })}
              </div>
            </section>
          )
        })}

        {/* Closing */}
        <section className="bg-brand-bg-alt rounded-card p-6">
          <p className="text-brand-muted leading-relaxed">
            That&rsquo;s it. Start with what you know. The platform shows you the rest.
          </p>
          <p className="text-brand-muted mt-3">
            Questions? Reach us at{' '}
            <a
              href="mailto:hello@thechangelab.net"
              className="text-brand-accent hover:underline font-medium"
            >
              hello@thechangelab.net
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
