'use client'

import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Mail } from 'lucide-react'
import { SeedOfLife } from '@/components/geo/sacred'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslation } from '@/lib/use-translation'
import { filterNavItems } from '@/lib/feature-flags'

export function D2Footer() {
  const { t } = useTranslation()

  const DISCOVER = filterNavItems([
    { label: t('d2footer.civic_compass'), href: '/compass' },
    { label: t('d2footer.topics'), href: '/pathways' },
    { label: t('d2footer.news'), href: '/news' },
    { label: t('d2footer.live_dashboard'), href: '/dashboard-live' },
    { label: t('d2footer.three_good_things'), href: '/goodthings' },
    { label: t('d2footer.polling_places'), href: '/polling-places' },
    { label: t('discover.geography'), href: '/geography' },
    { label: t('d2footer.tirz_zones'), href: '/tirz' },
  ])

  const LEARN = filterNavItems([
    { label: t('d2footer.knowledge_graph'), href: '/knowledge-graph' },
    { label: t('d2footer.library'), href: '/library' },
    { label: t('d2footer.foundations'), href: '/foundations' },
  ])

  const ACT = filterNavItems([
    { label: t('d2footer.call_senators'), href: '/call-your-senators' },
    { label: t('d2footer.volunteer'), href: '/opportunities' },
    { label: t('d2footer.partner'), href: '/about' },
  ])

  const ABOUT = [
    { label: t('d2footer.about_change_lab'), href: '/about' },
    { label: t('d2footer.contact'), href: '/contact' },
    { label: t('d2footer.user_manual'), href: '/manual' },
    { label: t('d2footer.accessibility'), href: '/accessibility' },
    { label: t('d2footer.privacy_policy'), href: '/privacy' },
  ]

  return (
    <>
      {/* Spectrum bar — 7 pathway colors (new palette) */}
      <div className="flex h-[2px]">
        <div className="flex-1 bg-health" />
        <div className="flex-1 bg-families" />
        <div className="flex-1 bg-hood" />
        <div className="flex-1 bg-voice" />
        <div className="flex-1 bg-money" />
        <div className="flex-1 bg-planet" />
        <div className="flex-1 bg-blue" />
      </div>

      <footer className="bg-paper border-t-2 border-ink relative overflow-hidden">
        <div className="relative z-10 max-w-[1080px] mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <SeedOfLife color="#1b5e8a" size={44} />
                <div>
                  <span className="block font-display text-xl font-bold text-ink leading-tight">
                    {t('brand.name')}
                  </span>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
                    {t('brand.powered_by')}
                  </span>
                </div>
              </div>
              <p className="font-body italic text-[.88rem] text-dim mb-2">
                {t('brand.tagline')}
              </p>
              <p className="font-body text-[.82rem] leading-relaxed text-dim">
                {t('brand.description')}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <a href="https://www.facebook.com/TheChangeLabInc/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-faint hover:text-blue transition-colors">
                  <Facebook size={18} />
                </a>
                <a href="https://www.instagram.com/thechangelabinc" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-faint hover:text-blue transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="https://www.linkedin.com/company/the-change-lab-inc" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-faint hover:text-blue transition-colors">
                  <Linkedin size={18} />
                </a>
                <a href="mailto:hello@thechangelab.net" aria-label="Email" className="text-faint hover:text-blue transition-colors">
                  <Mail size={18} />
                </a>
              </div>
            </div>

            {/* Discover */}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint mb-3">
                {t('d2footer.discover')}
              </p>
              <div className="space-y-1">
                {DISCOVER.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-clay transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Learn */}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint mb-3">
                {t('d2footer.learn')}
              </p>
              <div className="space-y-1">
                {LEARN.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-clay transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Act */}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint mb-3">
                {t('d2footer.act')}
              </p>
              <div className="space-y-1">
                {ACT.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-clay transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint mb-3">
                {t('d2footer.about')}
              </p>
              <div className="space-y-1">
                {ABOUT.map(function (item) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-clay transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mission line */}
          <div className="mt-8 pt-6 border-t border-rule">
            <p className="font-body italic text-[.82rem] text-dim text-center max-w-2xl mx-auto">
              {t('brand.mission')}
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-4 pt-4 border-t border-rule flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.06em] text-faint">
            <p>&copy; {new Date().getFullYear()} {t('brand.copyright')}</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-clay transition-colors">{t('d2footer.privacy')}</Link>
              <Link href="/terms" className="hover:text-clay transition-colors">{t('d2footer.terms')}</Link>
              <Link href="/accessibility" className="hover:text-clay transition-colors">{t('d2footer.accessibility')}</Link>
              <span className="text-rule">&middot;</span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Closing */}
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
            {t('brand.built_in')}
          </p>

          {/* Crisis line */}
          <div className="mt-3 pt-3 border-t border-rule flex justify-center gap-4 font-mono text-[11px] text-faint">
            <span>{t('d2nav.crisis')}: <strong className="text-sm font-bold text-ink">988</strong></span>
            <span>{t('d2nav.city_services')}: <strong className="text-sm font-bold text-ink">311</strong></span>
            <span>{t('d2nav.social_services')}: <strong className="text-sm font-bold text-ink">211</strong></span>
            <span>{t('d2nav.dv_hotline')}: <strong className="text-sm font-bold text-ink">713-528-2121</strong></span>
          </div>
        </div>
      </footer>
    </>
  )
}
