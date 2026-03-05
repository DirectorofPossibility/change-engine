/**
 * @fileoverview Translated section headings and stat labels for the homepage.
 *
 * Small client components that provide i18n-aware headings for each
 * homepage section, plus translated stat labels and the "View all" link.
 */
'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'

/** Translated section heading with optional subtitle. */
export function HomeSectionHeading({ titleKey, subtitleKey }: { titleKey: string; subtitleKey?: string }) {
  const { t } = useTranslation()
  return (
    <>
      <h2 className="text-2xl font-bold text-brand-text mb-2">{t(titleKey)}</h2>
      {subtitleKey && <p className="text-brand-muted mb-6">{t(subtitleKey)}</p>}
    </>
  )
}

/** Translated "Available Resources" heading with "View all" link. */
export function HomeResourcesHeading() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-text">{t('home.available_resources')}</h2>
        <p className="text-brand-muted mt-1">{t('home.help_subtitle')}</p>
      </div>
      <Link href="/help" className="text-sm text-brand-accent hover:underline font-medium">
        {t('home.view_all')} &rarr;
      </Link>
    </div>
  )
}

/** Translated stat label shown below each stat circle. */
export function HomeStatLabel({ labelKey }: { labelKey: string }) {
  const { t } = useTranslation()
  return <span className="text-xs sm:text-sm text-brand-muted font-medium mt-2">{t(labelKey)}</span>
}

/** Translated "Community at a Glance" heading for the bottom stats bar. */
export function HomeCommunityGlance() {
  const { t } = useTranslation()
  return (
    <h2 className="text-xl font-bold text-center mb-8 text-gray-300">
      {t('home.community_glance')}
    </h2>
  )
}
