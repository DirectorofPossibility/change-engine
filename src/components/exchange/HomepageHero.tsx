/**
 * @fileoverview Translated hero section for the homepage.
 *
 * Client component that renders the hero text overlay (location label,
 * tagline, subtitle, and 3 CTA buttons) with i18n support. The server
 * page passes the background image and layout; this component handles
 * the translatable text.
 */
'use client'

import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

/**
 * Translatable hero text overlay with CTA buttons.
 */
export function HomepageHero() {
  const { t } = useTranslation()

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-gray-300 uppercase tracking-widest mb-4">
        {t('home.location')}
      </p>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-3xl leading-tight drop-shadow-lg">
        {BRAND.tagline}
      </h1>
      <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-xl leading-relaxed drop-shadow">
        {t('home.subtitle')}
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/pathways"
          className="px-6 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg"
          style={{ backgroundColor: BRAND.accent }}
        >
          {t('home.cta_pathways')}
        </Link>
        <Link
          href="/help"
          className="px-6 py-3 bg-white text-brand-text rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-lg"
        >
          {t('home.cta_help')}
        </Link>
        <Link
          href="/officials"
          className="px-6 py-3 bg-white/15 text-white rounded-full text-sm font-semibold hover:bg-white/25 border border-white/30 transition-colors backdrop-blur-sm"
        >
          {t('home.cta_officials')}
        </Link>
      </div>
    </div>
  )
}
