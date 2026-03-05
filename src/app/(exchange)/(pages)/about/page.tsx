import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — The Change Engine',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-4xl text-brand-text mb-8">
        About The Change Engine
      </h1>

      {/* Mission */}
      <section className="mb-10">
        <p className="text-brand-muted text-lg leading-relaxed">
          The Change Engine is a civic platform connecting Houston residents with
          resources, services, and opportunities for engagement. We organize
          community life — making it easier to find help, get involved, and hold
          decision-makers accountable.
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl text-brand-text mb-4">
          How It Works
        </h2>
        <ul className="space-y-3 text-brand-muted leading-relaxed">
          <li>
            We aggregate resources from community organizations, government
            agencies, and civic groups across Houston.
          </li>
          <li>
            Every piece of content is classified using AI and reviewed by
            community partners before publishing.
          </li>
          <li>
            Content is rewritten at a 6th-grade reading level so information is
            accessible to everyone.
          </li>
          <li>Available in English, Spanish, and Vietnamese.</li>
        </ul>
      </section>

      {/* Our Approach */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl text-brand-text mb-4">
          Our Approach
        </h2>
        <div className="space-y-3 text-brand-muted leading-relaxed">
          <p>
            We organize around 7 community pathways (Our Health, Our Families,
            Our Neighborhood, Our Voice, Our Money, Our Planet, The Bigger We)
            and 4 engagement centers (Learning, Action, Resource,
            Accountability).
          </p>
          <p>
            We use asset-based language — focusing on strengths, opportunities,
            and what&#39;s available rather than deficits.
          </p>
        </div>
      </section>

      {/* Built in Houston */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl text-brand-text mb-4">
          Built in Houston
        </h2>
        <p className="text-brand-muted leading-relaxed">
          The Change Engine is designed for Houston but built for replication.
          Our open approach to civic technology means any community can adapt
          this model.
        </p>
      </section>

      {/* Get Involved */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl text-brand-text mb-4">
          Get Involved
        </h2>
        <ul className="space-y-2">
          <li>
            <Link href="/me/submit" className="text-brand-accent hover:underline">
              Share a Resource
            </Link>
          </li>
          <li>
            <Link href="/signup" className="text-brand-accent hover:underline">
              Create an Account
            </Link>
          </li>
          <li>
            <Link href="/help" className="text-brand-accent hover:underline">
              Browse Resources
            </Link>
          </li>
        </ul>
      </section>

      {/* Contact */}
      <section>
        <p className="text-brand-muted">
          Questions? Reach us at{' '}
          <a
            href="mailto:hello@changeengine.us"
            className="text-brand-accent hover:underline"
          >
            hello@changeengine.us
          </a>
        </p>
      </section>
    </div>
  );
}
