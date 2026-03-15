'use client'

import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Mail } from 'lucide-react'
import { FlowerOfLife } from '@/components/geo/sacred'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslation } from '@/lib/use-translation'
import { filterNavItems } from '@/lib/feature-flags'
import { useSiteConfig } from '@/lib/contexts/SiteConfigContext'

export function D2Footer() {
  const { t } = useTranslation()
  const showSocials = useSiteConfig('footer_social_links')

  const FIND_HELP = filterNavItems([
    { label: 'What\'s available', href: '/help' },
    { label: 'Find on the map', href: '/geography' },
    { label: 'Volunteer', href: '/opportunities' },
    { label: 'Three Good Things', href: '/goodthings' },
  ])

  const STAY_INFORMED = filterNavItems([
    { label: 'News', href: '/news' },
    { label: 'Library', href: '/library' },
    { label: 'Topics', href: '/pathways' },
    { label: 'Civic Compass', href: '/compass' },
  ])

  const GET_INVOLVED = filterNavItems([
    { label: 'Contact your reps', href: '/call-your-senators' },
    { label: 'Elections', href: '/elections' },
    { label: 'Where to vote', href: '/polling-places' },
    { label: 'Live dashboard', href: '/dashboard-live' },
  ])

  const ABOUT = [
    { label: 'About us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'User manual', href: '/manual' },
    { label: 'Accessibility', href: '/accessibility' },
    { label: 'Privacy', href: '/privacy' },
  ]

  return (
    <>
      {/* Spectrum bar — 7 pathway colors */}
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
        {/* Subtle texture — FOL watermark */}
        <div className="absolute top-8 right-[-60px] opacity-[0.03] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={300} />
        </div>

        <div className="relative z-10 max-w-[1080px] mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
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
              <p className="text-sm leading-relaxed text-white/40">
                We connect people with the resources, organizations, and opportunities that make our city stronger.
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

            {/* Find Help */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">
                Find Help
              </p>
              <div className="space-y-1">
                {FIND_HELP.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Stay Informed */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">
                Stay Informed
              </p>
              <div className="space-y-1">
                {STAY_INFORMED.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Get Involved */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">
                Get Involved
              </p>
              <div className="space-y-1">
                {GET_INVOLVED.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">
                About
              </p>
              <div className="space-y-1">
                {ABOUT.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-white/40 text-center max-w-2xl mx-auto">
              Built with love in Houston, Texas. Everything here is free, always.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-wide text-white/25">
            <p>&copy; {new Date().getFullYear()} The Change Lab &middot; Houston, TX</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
              <Link href="/accessibility" className="hover:text-white/50 transition-colors">Accessibility</Link>
              <span className="text-white/10">&middot;</span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Crisis numbers — always visible, warm language */}
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
