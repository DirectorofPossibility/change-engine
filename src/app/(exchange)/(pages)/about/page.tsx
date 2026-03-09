import type { Metadata } from 'next'
import Link from 'next/link'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { BookOpen, Users, Globe, MapPin, Shield, Mail } from 'lucide-react'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'About — Community Exchange',
  description: 'Learn about the Community Exchange, a civic platform connecting Houston residents with resources, services, and civic participation opportunities.',
}

const SECTIONS = [
  {
    icon: BookOpen,
    title: 'Our Mission',
    body: 'The Community Exchange organizes community life — making it easier to discover resources, connect with organizations, and participate in civic life. We believe every person has strengths to contribute and every neighborhood has assets to build on.',
  },
  {
    icon: Users,
    title: 'How It Works',
    body: 'We aggregate resources from community organizations, government agencies, and civic groups across Houston. Every piece of content is classified using AI and reviewed by community partners. Content is written at a 6th-grade reading level so information is accessible to everyone.',
  },
  {
    icon: Globe,
    title: 'Available in Three Languages',
    body: 'The Community Exchange is available in English, Spanish, and Vietnamese — reflecting the linguistic diversity of Houston. Translations are reviewed for accuracy and cultural relevance.',
  },
  {
    icon: MapPin,
    title: 'Built in Houston',
    body: 'The Community Exchange is designed for Houston but built for replication. Our open approach to civic technology means any community can adapt this model to organize their own community life.',
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

export default function AboutPage() {
  return (
    <div>
      <IndexPageHero
        color="#C75B2A"
        pattern="flower"
        title="About the Community Exchange"
        subtitle="Community life, organized."
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'About' }]} />

        {/* Mission & approach sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
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

        {/* Our Approach */}
        <div
          className="bg-white rounded-xl border-2 border-brand-border p-6 mt-6"
          style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-brand-accent" />
            </div>
            <h2 className="font-serif font-bold text-brand-text text-lg">Our Approach</h2>
          </div>
          <div className="text-sm text-brand-muted leading-relaxed space-y-3">
            <p>
              We organize around 7 community pathways (Our Health, Our Families,
              Our Neighborhood, Our Voice, Our Money, Our Planet, The Bigger We)
              and 4 engagement centers (Learning, Action, Resource, Accountability).
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
              <p className="font-serif font-bold text-brand-text text-sm mb-1">Powered by The Change Lab</p>
              <p className="text-xs text-brand-muted leading-relaxed">
                The Change Lab builds civic technology that helps communities organize, connect, and thrive.
              </p>
            </div>
          </div>

          <div className="bg-brand-bg-alt rounded-xl p-6 flex items-start gap-4">
            <Mail size={20} className="text-brand-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-serif font-bold text-brand-text text-sm mb-1">Get in Touch</p>
              <p className="text-xs text-brand-muted">
                Questions or ideas?{' '}
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
