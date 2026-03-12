import type { Metadata } from 'next'
import { PageHero } from '@/components/exchange/PageHero'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Donate — Community Exchange',
  description: 'Help us keep Community Exchange free for everyone. Your donation keeps civic infrastructure running.',
}

const tiers = [
  { amount: '$10/month', label: 'Neighbor', desc: 'Keeps one data source synced for a month.' },
  { amount: '$25/month', label: 'Block Captain', desc: 'Covers translation costs for one language.' },
  { amount: '$50/month', label: 'Connector', desc: 'Supports one week of editorial review.' },
  { amount: '$100/month', label: 'Infrastructure Partner', desc: 'Covers hosting and database for a month.' },
]

const impactItems = [
  { bold: '174 tables', rest: ' of connected civic data — updated every day.' },
  { bold: '4 levels of government', rest: ' synced every morning.' },
  { bold: '3 languages', rest: ' — English, Spanish, Vietnamese.' },
  { bold: '6th-grade reading level', rest: ' on every piece of content.' },
  { bold: 'Zero ads.', rest: ' Ever.' },
]

export default function DonatePage() {
  return (
    <div>
      <PageHero
        variant="editorial"
        title="Help us keep it free for everyone."
        subtitle="Community Exchange is free. It stays free because people like you think it should be."
        intro="Civic infrastructure shouldn't cost money to access. Building it does."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mission */}
        <section className="mb-12">
          <div className="space-y-4 text-brand-muted text-lg leading-relaxed">
            <p>
              Knowing who represents you. Finding services in your neighborhood.
              Understanding how to get involved. That information shouldn&rsquo;t
              cost anything to access.
            </p>
            <p>
              But building and maintaining the platform that makes it all
              findable — that costs real money.
            </p>
            <p>
              Your donation keeps the data accurate, the platform running, and
              the doors open.
            </p>
          </div>
        </section>

        {/* What Your Money Does */}
        <section className="mb-12">
          <h2 className="text-title font-bold text-brand-text mb-6">
            What your money does
          </h2>
          <div className="space-y-3">
            {impactItems.map(function (item, i) {
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-sm bg-brand-accent flex-shrink-0 mt-2" />
                  <p className="text-brand-muted leading-relaxed">
                    <strong className="text-brand-text">{item.bold}</strong>
                    {item.rest}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Tiers */}
        <section className="mb-12">
          <h2 className="text-title font-bold text-brand-text mb-6">
            Choose your level
          </h2>
          <div className="space-y-3">
            {tiers.map(function (tier) {
              return (
                <div
                  key={tier.label}
                  className="bg-white rounded-card border border-brand-border p-5 relative overflow-hidden"
                 
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent" />
                  <div className="pl-3">
                    <p className="font-display font-bold text-brand-text">
                      {tier.amount} — {tier.label}.
                    </p>
                    <p className="text-sm text-brand-muted mt-1">{tier.desc}</p>
                  </div>
                </div>
              )
            })}
            {/* Custom amount */}
            <div
              className="bg-brand-bg rounded-card border border-brand-border p-5 relative overflow-hidden"
             
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent" />
              <div className="pl-3">
                <p className="font-display font-bold text-brand-text">
                  Your amount.
                </p>
                <p className="text-sm text-brand-muted mt-1">
                  Give what you can. All of it matters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 text-center">
          <a
            href="https://www.paypal.com/donate/?hosted_button_id=PLACEHOLDER"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-brand-accent text-white rounded-card text-base font-semibold hover:bg-brand-accent-hover transition-colors"
          >
            Make a Donation
          </a>
        </section>

        {/* Tax Info */}
        <section className="mb-12 bg-brand-bg-alt rounded-card p-6">
          <p className="text-sm text-brand-muted leading-relaxed">
            The Change Lab is fiscally sponsored by Impact Hub Houston, a
            501(c)(3). Your donation is tax-deductible.
          </p>
        </section>

        {/* Closing */}
        <section className="relative bg-white rounded-card border border-brand-border p-8 text-center overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.04]">
            <FOLWatermark variant="flower" size="md" color="#C75B2A" />
          </div>
          <p className="font-display text-lg font-bold text-brand-text">
            Civic infrastructure only works if someone maintains it.
          </p>
          <p className="text-brand-muted mt-2">
            Thank you for being that someone.
          </p>
        </section>
      </div>
    </div>
  )
}
