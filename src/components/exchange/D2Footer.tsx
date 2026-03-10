'use client'

import Link from 'next/link'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { TipsToggle } from './TipsToggle'
import { useTranslation } from '@/lib/use-translation'
import Image from 'next/image'

export function D2Footer() {
  const { t } = useTranslation()

  const DISCOVER = [
    { label: t('d2footer.civic_compass'), href: '/compass' },
    { label: t('d2footer.topics'), href: '/pathways' },
    { label: t('d2footer.news'), href: '/news' },
    { label: t('d2footer.live_dashboard'), href: '/dashboard-live' },
    { label: t('d2footer.three_good_things'), href: '/goodthings' },
    { label: t('d2footer.polling_places'), href: '/polling-places' },
    { label: t('d2footer.tirz_zones'), href: '/tirz' },
  ]

  const LEARN = [
    { label: t('d2footer.knowledge_graph'), href: '/knowledge-graph' },
    { label: t('d2footer.library'), href: '/library' },
    { label: t('d2footer.foundations'), href: '/foundations' },
  ]

  const ACT = [
    { label: t('d2footer.call_senators'), href: '/call-your-senators' },
    { label: t('d2footer.volunteer'), href: '/opportunities' },
    { label: t('d2footer.partner'), href: '/about' },
  ]

  const ABOUT = [
    { label: t('d2footer.about_change_lab'), href: '/about' },
    { label: t('d2footer.our_approach'), href: '/pathways' },
    { label: t('d2footer.contact'), href: '/contact' },
    { label: t('d2footer.user_manual'), href: '/manual' },
    { label: t('d2footer.accessibility'), href: '/accessibility' },
    { label: t('d2footer.privacy_policy'), href: '/privacy' },
  ]

  return (
    <>
      {/* Spectrum bar */}
      <div className="spectrum-bar">
        <div style={{ background: '#e53e3e' }} />
        <div style={{ background: '#dd6b20' }} />
        <div style={{ background: '#d69e2e' }} />
        <div style={{ background: '#38a169' }} />
        <div style={{ background: '#3182ce' }} />
        <div style={{ background: '#319795' }} />
        <div style={{ background: '#805ad5' }} />
      </div>

      <footer className="bg-brand-bg-alt relative overflow-hidden border-t border-brand-border">
        {/* FOL watermark */}
        <Image
          src="/images/fol/flower-full.svg"
          alt=""
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-[0.04]"
         width={200} height={200} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-2 relative">
              {/* Big FOL watermark behind brand section */}
              <Image
                src="/images/fol/flower-full.svg"
                alt="" aria-hidden="true"
                className="absolute -top-[30px] -left-[40px] w-[280px] h-[280px] pointer-events-none opacity-[0.06]"
               width={200} height={200} />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <FlowerOfLifeIcon size={44} color="#C75B2A" />
                  <div>
                    <span className="block font-serif text-xl font-bold text-brand-text leading-tight">{t('brand.name')}</span>
                    <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-brand-muted-light">{t('brand.powered_by')}</span>
                  </div>
                </div>
                <p className="font-serif italic text-[15px] text-brand-muted mb-2">
                  {t('brand.tagline')}
                </p>
                <p className="text-[13px] leading-relaxed text-brand-muted">
                  {t('brand.description')}
                </p>
              </div>
            </div>

            {/* Discover */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">{t('d2footer.discover')}</p>
              <div className="space-y-1">
                {DISCOVER.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Learn */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">{t('d2footer.learn')}</p>
              <div className="space-y-1">
                {LEARN.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Act */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">{t('d2footer.act')}</p>
              <div className="space-y-1">
                {ACT.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">{t('d2footer.about')}</p>
              <div className="space-y-1">
                {ABOUT.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mission line */}
          <div className="mt-8 pt-6 border-t border-brand-border">
            <p className="text-[13px] italic text-brand-muted text-center max-w-2xl mx-auto">
              {t('brand.mission')}
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-4 pt-4 border-t border-brand-border flex flex-wrap items-center justify-between gap-4 text-[11px] text-brand-muted-light">
            <p>&copy; {new Date().getFullYear()} {t('brand.copyright')}</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-brand-accent transition-colors">{t('d2footer.privacy')}</Link>
              <Link href="/terms" className="hover:text-brand-accent transition-colors">{t('d2footer.terms')}</Link>
              <Link href="/accessibility" className="hover:text-brand-accent transition-colors">{t('d2footer.accessibility')}</Link>
              <span className="text-brand-border">|</span>
              <TipsToggle />
              <span className="text-brand-border">|</span>
              <span>English &middot; Espa&ntilde;ol &middot; Ti&#7871;ng Vi&#7879;t</span>
            </div>
          </div>

          {/* Closing */}
          <p className="mt-3 text-center text-[10px] text-brand-muted-light">
            {t('brand.built_in')}
          </p>

          {/* Crisis line */}
          <div className="mt-3 pt-3 border-t border-brand-border/50 flex justify-center gap-4 font-mono text-[11px] text-brand-muted-light">
            <span>{t('d2nav.crisis')}: <strong className="text-brand-text">988</strong></span>
            <span>{t('d2nav.city_services')}: <strong className="text-brand-text">311</strong></span>
            <span>{t('d2nav.social_services')}: <strong className="text-brand-text">211</strong></span>
            <span>{t('d2nav.dv_hotline')}: <strong className="text-brand-text">713-528-2121</strong></span>
          </div>
        </div>
      </footer>
    </>
  )
}
