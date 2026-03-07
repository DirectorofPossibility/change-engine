import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/exchange/PageHero'

export const metadata: Metadata = {
  title: 'About — Community Exchange',
}

export default function AboutPage() {
  return (
    <div>
      <PageHero
        variant="editorial"
        title="About the Community Exchange"
        subtitle="Community life, organized."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission */}
        <section className="mb-12">
          <p className="text-brand-muted text-lg leading-relaxed">
            The Community Exchange is a civic platform connecting Houston residents with
            resources, services, and opportunities for engagement. We organize
            community life — making it easier to find help, get involved, and hold
            decision-makers accountable.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-title font-bold text-brand-text mb-4">
            How It Works
          </h2>
          <div className="space-y-4">
            {[
              'We aggregate resources from community organizations, government agencies, and civic groups across Houston.',
              'Every piece of content is classified using AI and reviewed by community partners before publishing.',
              'Content is rewritten at a 6th-grade reading level so information is accessible to everyone.',
              'Available in English, Spanish, and Vietnamese.',
            ].map(function (text, i) {
              return (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-accent">
                    {i + 1}
                  </div>
                  <p className="text-brand-muted leading-relaxed pt-1">{text}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Our Approach */}
        <section className="mb-12">
          <h2 className="text-title font-bold text-brand-text mb-4">
            Our Approach
          </h2>
          <div className="space-y-4 text-brand-muted leading-relaxed">
            <p>
              We organize around 7 community pathways (Our Health, Our Families,
              Our Neighborhood, Our Voice, Our Money, Our Planet, The Bigger We)
              and 4 engagement centers (Learning, Action, Resource, Accountability).
            </p>
            <p>
              We use asset-based language — focusing on strengths, opportunities,
              and what&#39;s available rather than deficits.
            </p>
          </div>
        </section>

        {/* Built in Houston */}
        <section className="mb-12">
          <h2 className="text-title font-bold text-brand-text mb-4">
            Built in Houston
          </h2>
          <p className="text-brand-muted leading-relaxed">
            The Community Exchange is designed for Houston but built for replication.
            Our open approach to civic technology means any community can adapt
            this model.
          </p>
        </section>

        {/* What You Can Do */}
        <section className="mb-12">
          <h2 className="text-title font-bold text-brand-text mb-4">
            What You Can Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/me/submit', label: 'Share a Resource', desc: 'Know a service or resource? Help the community.' },
              { href: '/signup', label: 'Create an Account', desc: 'Save resources and personalize your experience.' },
              { href: '/help', label: 'Browse Resources', desc: 'Explore what is available for any life situation.' },
            ].map(function (item) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group bg-white rounded-card border border-brand-border p-5 card-lift"
                >
                  <h3 className="font-serif font-bold text-brand-text text-sm mb-1 group-hover:text-brand-accent transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-xs text-brand-muted">{item.desc}</p>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-brand-bg-alt rounded-card p-6">
          <p className="text-brand-muted">
            Questions? Reach us at{' '}
            <a href="mailto:hello@changeengine.us" className="text-brand-accent hover:underline font-medium">
              hello@changeengine.us
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
