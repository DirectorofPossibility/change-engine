'use client'

import Link from 'next/link'
import { SeedOfLife } from '@/components/geo/sacred'
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
        <div className="flex-1" style={{ background: '#1a6b56' }} />
        <div className="flex-1" style={{ background: '#1e4d7a' }} />
        <div className="flex-1" style={{ background: '#4a2870' }} />
        <div className="flex-1" style={{ background: '#7a2018' }} />
        <div className="flex-1" style={{ background: '#6a4e10' }} />
        <div className="flex-1" style={{ background: '#1a5030' }} />
        <div className="flex-1" style={{ background: '#1a3460' }} />
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
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-blue transition-colors"
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
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-blue transition-colors"
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
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-blue transition-colors"
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
                      className="block py-0.5 font-body text-[.82rem] text-dim hover:text-blue transition-colors"
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
              <Link href="/privacy" className="hover:text-blue transition-colors">{t('d2footer.privacy')}</Link>
              <Link href="/terms" className="hover:text-blue transition-colors">{t('d2footer.terms')}</Link>
              <Link href="/accessibility" className="hover:text-blue transition-colors">{t('d2footer.accessibility')}</Link>
              <span className="text-rule">&middot;</span>
              <span>English &middot; Espa&ntilde;ol &middot; Ti&#7871;ng Vi&#7879;t</span>
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
