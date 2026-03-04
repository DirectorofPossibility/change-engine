'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { BRAND } from '@/lib/constants'

export function HeroBook() {
  const { t } = useTranslation()

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
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
        <p className="text-lg sm:text-xl font-serif italic text-brand-muted mb-16">
          {BRAND.tagline}
        </p>

        {/* Scroll prompt */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-brand-muted font-medium">
            {t('hero.scroll_prompt')}
          </p>
          <ChevronDown
            size={24}
            className="text-brand-muted/60 animate-bounce-slow"
          />
        </div>
      </div>
    </section>
  )
}
