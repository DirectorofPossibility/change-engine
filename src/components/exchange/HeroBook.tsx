'use client'

import { useTranslation } from '@/lib/use-translation'
import { BRAND, THEMES } from '@/lib/constants'

/** Spectrum bar showing all 7 pathway colors */
function SpectrumBar() {
  const colors = Object.values(THEMES).map(function (t) { return t.color })
  return (
    <div className="flex h-1 rounded-full max-w-xs mx-auto overflow-hidden">
      {colors.map(function (color) {
        return <div key={color} className="flex-1" style={{ backgroundColor: color }} />
      })}
    </div>
  )
}

export function HeroBook() {
  const { t } = useTranslation()

  return (
    <section className="relative flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center">
      {/* Warm radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(199,91,42,0.06) 0%, rgba(61,90,90,0.02) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Brand mark */}
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-brand-muted font-semibold mb-6">
          {t('home.location')}
        </p>

        {/* Main title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-brand-text leading-tight mb-4">
          {t('hero.title_line1')}{' '}
          <span style={{ color: BRAND.accent }}>{t('hero.title_line2')}</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl font-serif italic text-brand-muted mb-8">
          {BRAND.tagline}
        </p>

        {/* Spectrum bar — 7 pathway colors */}
        <SpectrumBar />

        {/* Scroll prompt */}
        <div className="mt-8">
          <p className="text-sm text-brand-muted font-medium">
            {t('hero.scroll_prompt')}
          </p>
        </div>
      </div>
    </section>
  )
}
