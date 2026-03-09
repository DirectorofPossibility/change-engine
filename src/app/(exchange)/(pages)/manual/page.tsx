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
    title: 'Follow what\u2019s happening',
    paragraphs: [
      'The live dashboard shows what\u2019s moving right now \u2014 legislation, community activity, events you can attend.',
      'Three Good Things shows you three positive civic stories every day.',
    ],
  },
  {
    title: 'Save what matters',
    paragraphs: [
      'Create a free account to save officials, organizations, and articles. Set your language. Get notified about things in your area.',
      'You don\u2019t need an account. But it helps if you want to keep track.',
    ],
  },
  {
    title: 'Languages',
    paragraphs: [
      'English, Spanish, and Vietnamese. Switch in the top navigation or in your settings.',
      'All service content is reviewed by a human editor before it publishes in any language.',
    ],
  },
  {
    title: 'Wayfinder',
    paragraphs: [
      'At the bottom of every page \u2014 every official, every organization, every service \u2014 you\u2019ll see Wayfinder. It shows you what\u2019s connected to what you\u2019re looking at. Three hops out from any starting point.',
      'It\u2019s how you go from \u2018I need help with rent\u2019 to \u2018here are the organizations, the officials responsible, and the policy that funds it\u2019 \u2014 without having to already know where to look.',
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
              href="mailto:hello@changeengine.us"
              className="text-brand-accent hover:underline font-medium"
            >
              hello@changeengine.us
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
