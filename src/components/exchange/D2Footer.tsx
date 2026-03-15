'use client'

import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Mail } from 'lucide-react'
import { FlowerOfLife } from '@/components/geo/sacred'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslation } from '@/lib/use-translation'
import { filterNavItems } from '@/lib/feature-flags'
import { useSiteConfig } from '@/lib/contexts/SiteConfigContext'
import { THEMES } from '@/lib/constants'

const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: (t as any).name, color: (t as any).color, slug: (t as any).slug }
})

export function D2Footer() {
  const { t } = useTranslation()
  const showSocials = useSiteConfig('footer_social_links')

  const COMMUNITY = filterNavItems([
    { label: 'Neighborhoods', href: '/neighborhoods' },
    { label: 'Super neighborhoods', href: '/super-neighborhoods' },
    { label: 'Organizations', href: '/organizations' },
    { label: 'Foundations', href: '/foundations' },
    { label: 'Events calendar', href: '/calendar' },
    { label: 'Events', href: '/events' },
    { label: 'Three Good Things', href: '/goodthings' },
    { label: 'Stories', href: '/stories' },
    { label: 'Teen Hub', href: '/teens' },
  ])

  const LEARN = filterNavItems([
    { label: 'News', href: '/news' },
    { label: 'Library', href: '/library' },
    { label: 'Bookshelf', href: '/bookshelf' },
    { label: 'Topics', href: '/pathways' },
    { label: 'Guides', href: '/guides' },
    { label: 'Collections', href: '/collections' },
    { label: 'Glossary', href: '/glossary' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Civic Compass', href: '/compass' },
    { label: 'Ask Chance', href: '/chat' },
  ])

  const FIND_HELP = filterNavItems([
    { label: 'What\u2019s available', href: '/help' },
    { label: 'Services', href: '/services' },
    { label: 'Municipal services', href: '/municipal-services' },
    { label: 'Benefits', href: '/benefits' },
    { label: 'Agencies', href: '/agencies' },
    { label: 'Volunteer', href: '/opportunities' },
    { label: 'Find on the map', href: '/geography' },
    { label: 'Explore', href: '/explore' },
  ])

  const GET_INVOLVED = filterNavItems([
    { label: 'Elections', href: '/elections' },
    { label: 'Candidates', href: '/candidates' },
    { label: 'Your ballot', href: '/ballot' },
    { label: 'Officials', href: '/officials' },
    { label: 'Look up your reps', href: '/officials/lookup' },
    { label: 'Contact your reps', href: '/call-your-senators' },
    { label: 'Where to vote', href: '/polling-places' },
    { label: 'Districts', href: '/districts' },
    { label: 'Governance', href: '/governance' },
    { label: 'Policies', href: '/policies' },
    { label: 'Campaigns', href: '/campaigns' },
    { label: 'Live dashboard', href: '/dashboard-live' },
  ])

  const ABOUT = [
    { label: 'About us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'User manual', href: '/manual' },
    { label: 'Donate', href: '/donate' },
    { label: 'Submit content', href: '/me/submit' },
    { label: 'Search', href: '/search' },
    { label: 'My account', href: '/me' },
    { label: 'Data', href: '/data' },
    { label: 'UN SDGs', href: '/sdgs' },
    { label: 'TIRZ', href: '/tirz' },
  ]

  const linkClass = 'block py-0.5 text-sm text-white/50 hover:text-white transition-colors'

  return (
    <>
      {/* Spectrum bar */}
      <div className="flex h-[3px]">
        <div className="flex-1 bg-health" />
        <div className="flex-1 bg-families" />
        <div className="flex-1 bg-hood" />
        <div className="flex-1 bg-voice" />
        <div className="flex-1 bg-money" />
        <div className="flex-1 bg-planet" />
        <div className="flex-1 bg-blue" />
      </div>

      <footer className="bg-ink text-white/60 relative overflow-hidden">
        <div className="absolute top-8 right-[-60px] opacity-[0.03] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={300} />
        </div>

        <div className="relative z-10 max-w-[1080px] mx-auto px-6 py-10">
          {/* Top row: brand + 5 nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-3 md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-white/10">
                  <FlowerOfLife color="#ffffff" size={28} />
                </div>
                <div>
                  <span className="block font-display text-lg font-bold text-white leading-tight">
                    Community Exchange
                  </span>
                  <span className="block text-xs text-white/30">
                    Powered by The Change Lab
                  </span>
                </div>
              </div>
              <p className="text-sm text-white/50 mb-2">
                Your neighbor&apos;s guide to Houston — everything free, everything local.
              </p>
              {showSocials && <div className="flex items-center gap-3 mt-3">
                <a href="https://www.facebook.com/TheChangeLabInc/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/30 hover:text-white/70 transition-colors">
                  <Facebook size={18} />
                </a>
                <a href="https://www.instagram.com/thechangelabinc" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/30 hover:text-white/70 transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="https://www.linkedin.com/company/the-change-lab-inc" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-white/30 hover:text-white/70 transition-colors">
                  <Linkedin size={18} />
                </a>
                <a href="mailto:hello@thechangelab.net" aria-label="Email" className="text-white/30 hover:text-white/70 transition-colors">
                  <Mail size={18} />
                </a>
              </div>}
            </div>

            {/* Community */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Community</p>
              <div className="space-y-1">
                {COMMUNITY.map(function (item) {
                  return <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>
                })}
              </div>
            </div>

            {/* Learn */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Learn</p>
              <div className="space-y-1">
                {LEARN.map(function (item) {
                  return <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>
                })}
              </div>
            </div>

            {/* Find Help */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Find Help</p>
              <div className="space-y-1">
                {FIND_HELP.map(function (item) {
                  return <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>
                })}
              </div>
            </div>

            {/* Get Involved */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Get Involved</p>
              <div className="space-y-1">
                {GET_INVOLVED.map(function (item) {
                  return <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">About</p>
              <div className="space-y-1">
                {ABOUT.map(function (item) {
                  return <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>
                })}
              </div>
            </div>
          </div>

          {/* Pathways row */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Pathways</p>
            <div className="flex flex-wrap gap-3">
              {PATHWAY_LIST.map(function (pw) {
                return (
                  <Link
                    key={pw.id}
                    href={'/pathways/' + pw.slug}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 flex-shrink-0" style={{ background: pw.color }} />
                    {pw.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/25">
            <p>&copy; {new Date().getFullYear()} The Change Lab &middot; Houston, TX</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
              <Link href="/accessibility" className="hover:text-white/50 transition-colors">Accessibility</Link>
              <span className="text-white/10">&middot;</span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Crisis numbers */}
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-center gap-4 flex-wrap text-xs text-white/30">
            <span>Need help now? <strong className="text-white/60">988</strong></span>
            <span>City help: <strong className="text-white/60">311</strong></span>
            <span>Social services: <strong className="text-white/60">211</strong></span>
            <span>DV hotline: <strong className="text-white/60">713-528-2121</strong></span>
          </div>
        </div>
      </footer>
    </>
  )
}
