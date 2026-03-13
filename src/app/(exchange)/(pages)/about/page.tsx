import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getExchangeStats } from '@/lib/data/homepage'

export const revalidate = 86400


export const metadata: Metadata = {
  title: 'About -- The Change Engine',
  description: 'The Change Engine is a civic platform connecting Houston residents with resources, services, officials, and civic participation opportunities -- in English, Spanish, and Vietnamese.',
}

const SECTIONS = [
  {
    title: 'Our Mission',
    body: 'Change Engine organizes community life -- making it easier to discover resources, connect with organizations, and participate in civic life. We believe every person has strengths to contribute and every neighborhood has assets to build on.',
  },
  {
    title: 'How It Works',
    body: 'We aggregate resources from community organizations, government agencies, and civic groups across Houston. Every piece of content is classified using AI across 16 taxonomy dimensions and reviewed by community partners. All content is written at a 6th-grade reading level so information is accessible to everyone.',
  },
  {
    title: 'Available in Three Languages',
    body: 'Change Engine is available in English, Spanish, and Vietnamese -- reflecting the three most-spoken languages in Greater Houston. Translations are generated using AI and reviewed for accuracy and cultural relevance.',
  },
  {
    title: 'Built in Houston, Built for Replication',
    body: 'The Change Engine is designed for Houston but architected for replication. Our open approach to civic technology means any community can adapt this model to organize their own community life around their own priorities.',
  },
]

const THEORY_OF_CHANGE = [
  {
    title: 'Information Is Power',
    body: 'When people can easily find who represents them, what policies affect them, and what services are available -- they participate. We remove the friction between residents and civic life.',
  },
  {
    title: 'Asset-Based, Not Deficit-Based',
    body: 'We focus on what communities have, not what they lack. Every neighborhood has organizations, leaders, and resources. We make them visible and connected.',
  },
  {
    title: 'AI for Equity',
    body: 'We use AI to classify, translate, and simplify civic information -- ensuring that language, literacy, and time are never barriers to participation. Technology should serve everyone, not just the privileged.',
  },
]

export default async function AboutPage() {
  const stats = await getExchangeStats()
  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.organizations || 0) + (stats.policies || 0) + (stats.officials || 0)

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-14">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{  }} className="text-3xl sm:text-4xl mt-2">
            Community life, organized.
          </h1>
          <p style={{ color: "#5c6474" }} className="text-lg mt-3 max-w-xl leading-relaxed">
            Most people never show up -- not because they don&apos;t care, but because nobody showed them the way in. Change Engine maps every resource, every official, every opportunity in Houston and connects them into one accessible platform.
          </p>
          {/* Stats */}
          <div className="flex items-center gap-8 mt-6">
            <div>
              <p style={{  }} className="text-2xl font-bold">{totalResources.toLocaleString()}</p>
              <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-wide">total resources</p>
            </div>
            <div className="w-px h-10" style={{ background: '#dde1e8' }} />
            <div>
              <p style={{  }} className="text-2xl font-bold">{stats.organizations || 0}</p>
              <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-wide">organizations</p>
            </div>
            <div className="w-px h-10" style={{ background: '#dde1e8' }} />
            <div>
              <p style={{  }} className="text-2xl font-bold">{stats.officials || 0}</p>
              <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-wide">officials</p>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>About</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* ── What We Do ── */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{  }} className="text-xl">What We Do</h2>
          <span style={{ color: "#5c6474" }} className="text-[11px]">{SECTIONS.length} areas</span>
        </div>
        <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-6" />

        <div className="space-y-5">
          {SECTIONS.map(function (section) {
            return (
              <div key={section.title} className="p-6" style={{ border: '1px solid #dde1e8' }}>
                <h3 style={{  }} className="text-lg mb-2">{section.title}</h3>
                <p style={{ color: "#5c6474" }} className="text-sm leading-relaxed">{section.body}</p>
              </div>
            )
          })}
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #dde1e8' }} className="my-10" />

        {/* ── Theory of Change ── */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{  }} className="text-xl">Theory of Change</h2>
          <span style={{ color: "#5c6474" }} className="text-[11px]">{THEORY_OF_CHANGE.length} principles</span>
        </div>
        <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {THEORY_OF_CHANGE.map(function (item) {
            return (
              <div key={item.title} className="p-6" style={{ border: '1px solid #dde1e8' }}>
                <h3 style={{  }} className="text-base mb-2">{item.title}</h3>
                <p style={{ color: "#5c6474" }} className="text-sm leading-relaxed">{item.body}</p>
              </div>
            )
          })}
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #dde1e8' }} className="my-10" />

        {/* ── How We Organize ── */}
        <h2 style={{  }} className="text-xl mb-1">How We Organize</h2>
        <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-6" />

        <div className="p-6" style={{ border: '1px solid #dde1e8' }}>
          <div className="space-y-3 max-w-2xl text-sm leading-relaxed" style={{ color: "#5c6474" }}>
            <p className="flex gap-2">
              <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: '#1b5e8a' }} />
              <span>All content is organized around <strong style={{  }}>7 community pathways</strong> -- Health, Families, Neighborhood, Voice, Money, Planet, and The Bigger We -- and <strong style={{  }}>4 engagement modes</strong>: Learning, Action, Resource, and Accountability.</span>
            </p>
            <p className="flex gap-2">
              <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: '#1b5e8a' }} />
              <span>We use <strong style={{  }}>asset-based language</strong> -- focusing on strengths, opportunities, and what is available rather than deficits. Every community has resources to build on, and every resident has something valuable to contribute.</span>
            </p>
            <p className="flex gap-2">
              <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: '#1b5e8a' }} />
              <span>Every entity is classified across <strong style={{  }}>16 taxonomy dimensions</strong> using AI -- from focus areas and SDGs to audiences and service categories -- then connected via a knowledge mesh so resources travel across pathways.</span>
            </p>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #dde1e8' }} className="my-10" />

        {/* ── Explore the Exchange ── */}
        <h2 style={{  }} className="text-xl mb-1">Explore the Exchange</h2>
        <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/library', label: 'Library', desc: 'Research, reports, and policy briefs' },
            { href: '/services', label: 'Services', desc: 'Food, health, legal aid, and more' },
            { href: '/officials', label: 'Officials', desc: 'Who represents you at every level' },
            { href: '/opportunities', label: 'Opportunities', desc: 'Volunteer, intern, get involved' },
          ].map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block p-5 hover:opacity-80 transition-opacity"
                style={{ border: '1px solid #dde1e8' }}
              >
                <h3 style={{  }} className="text-sm mb-1">{item.label}</h3>
                <p style={{ color: "#5c6474" }} className="text-xs">{item.desc}</p>
                <span style={{ color: "#1b5e8a" }} className="inline-block mt-3 text-[10px]">
                  Explore &rarr;
                </span>
              </Link>
            )
          })}
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #dde1e8' }} className="my-10" />

        {/* ── Partner + Contact ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 bg-paper">
            <p style={{  }} className="font-bold mb-1">Built by The Change Lab</p>
            <p style={{ color: "#5c6474" }} className="text-sm leading-relaxed">
              The Change Lab builds civic technology in Houston. We use AI and open data to make it easier for people to show up, find resources, and get involved.
            </p>
          </div>

          <div className="p-6 bg-paper">
            <p style={{  }} className="font-bold mb-1">Partner With Us</p>
            <p style={{ color: "#5c6474" }} className="text-sm leading-relaxed">
              We work with community organizations, government agencies, and funders who believe in equitable access to civic information.{' '}
              <a href="mailto:hello@thechangelab.net" style={{ color: "#1b5e8a" }} className="hover:underline">
                hello@thechangelab.net
              </a>
            </p>
          </div>
        </div>

        {/* Legal */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6" style={{ borderTop: '1px solid #dde1e8' }}>
          {[
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/accessibility', label: 'Accessibility' },
            { href: '/contact', label: 'Contact Us' },
          ].map(function (link) {
            return (
              <Link key={link.href} href={link.href} style={{ color: "#5c6474" }} className="text-xs hover:underline">
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid #dde1e8' }} className="pt-4">
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
