import type { Metadata } from 'next'
import Link from 'next/link'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { BookOpen, Users, Globe, MapPin, Shield, Mail, TrendingUp, Lightbulb, Heart } from 'lucide-react'
import { getExchangeStats } from '@/lib/data/homepage'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'About — The Change Engine',
  description: 'The Change Engine is a civic platform connecting Houston residents with resources, services, officials, and civic participation opportunities — in English, Spanish, and Vietnamese.',
}

const SECTIONS = [
  {
    icon: BookOpen,
    title: 'Our Mission',
    body: 'The Change Engine organizes community life — making it easier to discover resources, connect with organizations, and participate in civic life. We believe every person has strengths to contribute and every neighborhood has assets to build on.',
  },
  {
    icon: Users,
    title: 'How It Works',
    body: 'We aggregate resources from community organizations, government agencies, and civic groups across Houston. Every piece of content is classified using AI across 16 taxonomy dimensions and reviewed by community partners. All content is written at a 6th-grade reading level so information is accessible to everyone.',
  },
  {
    icon: Globe,
    title: 'Available in Three Languages',
    body: 'The Change Engine is available in English, Spanish, and Vietnamese — reflecting the three most-spoken languages in Greater Houston. Translations are generated using AI and reviewed for accuracy and cultural relevance.',
  },
  {
    icon: MapPin,
    title: 'Built in Houston, Built for Replication',
    body: 'The Change Engine is designed for Houston but architected for replication. Our open approach to civic technology means any community can adapt this model to organize their own community life around their own priorities.',
  },
]

const THEORY_OF_CHANGE = [
  {
    icon: Lightbulb,
    title: 'Information Is Power',
    body: 'When people can easily find who represents them, what policies affect them, and what services are available — they participate. We remove the friction between residents and civic life.',
  },
  {
    icon: Heart,
    title: 'Asset-Based, Not Deficit-Based',
    body: 'We focus on what communities have, not what they lack. Every neighborhood has organizations, leaders, and resources. We make them visible and connected.',
  },
  {
    icon: TrendingUp,
    title: 'AI for Equity',
    body: 'We use AI to classify, translate, and simplify civic information — ensuring that language, literacy, and time are never barriers to participation. Technology should serve everyone, not just the privileged.',
  },
]

const LINKS = [
  { href: '/community', label: 'Community', desc: 'Neighborhoods, organizations, foundations, and events' },
  { href: '/learning', label: 'Learning', desc: 'Library, news, pathways, and Ask Chance' },
  { href: '/resources', label: 'Available Resources', desc: 'Services, opportunities, and life situations' },
  { href: '/action', label: 'Action', desc: 'Officials, policies, elections, and civic participation' },
]

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/accessibility', label: 'Accessibility' },
  { href: '/contact', label: 'Contact Us' },
]

export default async function AboutPage() {
  const stats = await getExchangeStats()
  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.organizations || 0) + (stats.policies || 0) + (stats.officials || 0)

  return (
    <div>
      <IndexPageHero
        color="#C75B2A"
        pattern="flower"
        title="About The Change Engine"
        subtitle="Community life, organized."
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'About' }]} />

        {/* Platform stats — impact at a glance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { n: totalResources, label: 'Total Resources' },
            { n: stats.organizations || 0, label: 'Organizations' },
            { n: stats.policies || 0, label: 'Policies Tracked' },
            { n: stats.officials || 0, label: 'Elected Officials' },
          ].map(function (stat) {
            return (
              <div key={stat.label} className="bg-white rounded-xl border-2 border-brand-border p-4 text-center" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                <p className="font-serif font-bold text-2xl text-brand-accent">{stat.n.toLocaleString()}</p>
                <p className="text-[11px] font-mono uppercase tracking-wider text-brand-muted mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Mission & approach sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {SECTIONS.map(function (section) {
            const Icon = section.icon
            return (
              <div
                key={section.title}
                className="bg-white rounded-xl border-2 border-brand-border p-6"
                style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-brand-accent" />
                  </div>
                  <h2 className="font-serif font-bold text-brand-text text-lg">{section.title}</h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">{section.body}</p>
              </div>
            )
          })}
        </div>

        {/* Theory of Change */}
        <h2 className="font-serif font-bold text-brand-text text-xl mt-10 mb-4">Theory of Change</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEORY_OF_CHANGE.map(function (item) {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-white rounded-xl border-2 border-brand-border p-6"
                style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-brand-accent" />
                  </div>
                  <h2 className="font-serif font-bold text-brand-text text-base">{item.title}</h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">{item.body}</p>
              </div>
            )
          })}
        </div>

        {/* Our Approach */}
        <div
          className="bg-white rounded-xl border-2 border-brand-border p-6 mt-6"
          style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-brand-accent" />
            </div>
            <h2 className="font-serif font-bold text-brand-text text-lg">How We Organize</h2>
          </div>
          <div className="text-sm text-brand-muted leading-relaxed space-y-3">
            <p>
              All content is organized around 7 community pathways — Health, Families,
              Neighborhood, Voice, Money, Planet, and The Bigger We — and 4 engagement
              modes: Learning, Action, Resource, and Accountability.
            </p>
            <p>
              We use asset-based language — focusing on strengths, opportunities,
              and what is available rather than deficits. Every community has resources
              to build on, and every resident has something valuable to contribute.
            </p>
          </div>
        </div>

        {/* Explore the Exchange */}
        <h2 className="font-serif font-bold text-brand-text text-xl mt-10 mb-4">Explore the Exchange</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LINKS.map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-xl border-2 border-brand-border p-5 hover:shadow-lg transition-all"
                style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
              >
                <h3 className="font-serif font-bold text-brand-text text-sm group-hover:text-brand-accent transition-colors">
                  {item.label}
                </h3>
                <p className="text-xs text-brand-muted mt-1">{item.desc}</p>
              </Link>
            )
          })}
        </div>

        {/* Powered by + Contact */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-brand-bg-alt rounded-xl p-6 flex items-start gap-4">
            <FlowerOfLifeIcon size={32} color="#C75B2A" className="flex-shrink-0 opacity-40 mt-0.5" />
            <div>
              <p className="font-serif font-bold text-brand-text text-sm mb-1">Built by The Change Lab</p>
              <p className="text-xs text-brand-muted leading-relaxed">
                The Change Lab builds civic technology that helps communities organize, connect, and thrive. We are a Houston-based team using AI, open data, and community partnerships to make civic participation accessible to everyone.
              </p>
            </div>
          </div>

          <div className="bg-brand-bg-alt rounded-xl p-6 flex items-start gap-4">
            <Mail size={20} className="text-brand-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-serif font-bold text-brand-text text-sm mb-1">Partner With Us</p>
              <p className="text-xs text-brand-muted leading-relaxed">
                We work with community organizations, government agencies, and funders who believe in equitable access to civic information.{' '}
                <a href="mailto:hello@changeengine.us" className="text-brand-accent hover:underline font-medium">
                  hello@changeengine.us
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-brand-border">
          {LEGAL_LINKS.map(function (link) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-brand-muted hover:text-brand-accent transition-colors"
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
