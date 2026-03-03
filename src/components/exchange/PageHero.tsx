/**
 * @fileoverview Reusable hero banner component for public-facing pages.
 *
 * Renders a full-width banner with a background SVG image, gradient overlay
 * for text readability, and customizable title/subtitle. Supports i18n via
 * optional `titleKey`/`subtitleKey` props that resolve against the UI
 * string dictionary.
 */
'use client'

import Image from 'next/image'
import { useTranslation } from '@/lib/i18n'

/** Height presets for the hero banner. */
const HEIGHT_MAP = {
  sm: 'h-48 sm:h-56',
  md: 'h-56 sm:h-72',
  lg: 'h-72 sm:h-96',
} as const

interface PageHeroProps {
  /** Primary heading displayed in the hero banner. */
  title?: string
  /** i18n key for the title (takes priority when provided). */
  titleKey?: string
  /** Optional secondary text below the title. */
  subtitle?: string
  /** i18n key for the subtitle (takes priority when provided). */
  subtitleKey?: string
  /** Path to the background image (SVG or raster). */
  backgroundImage: string
  /** Height preset for the banner. Defaults to 'md'. */
  height?: 'sm' | 'md' | 'lg'
}

/**
 * Full-width hero banner with background image, gradient overlay, and text.
 *
 * @param props - {@link PageHeroProps}
 */
export function PageHero({ title, titleKey, subtitle, subtitleKey, backgroundImage, height = 'md' }: PageHeroProps) {
  const { t } = useTranslation()
  const displayTitle = titleKey ? t(titleKey) : (title ?? '')
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle

  return (
    <section className={`relative ${HEIGHT_MAP[height]} w-full overflow-hidden`}>
      <Image
        src={backgroundImage}
        alt=""
        fill
        className="object-cover"
        priority
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      {/* Text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-12 px-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center drop-shadow-lg">
          {displayTitle}
        </h1>
        {displaySubtitle && (
          <p className="text-base sm:text-lg text-gray-200 mt-3 text-center max-w-2xl drop-shadow">
            {displaySubtitle}
          </p>
        )}
      </div>
    </section>
  )
}
