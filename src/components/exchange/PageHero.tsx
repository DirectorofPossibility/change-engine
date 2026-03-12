'use client'

import Image from 'next/image'
import { useTranslation } from '@/lib/use-translation'
import { ImageLightbox } from './ImageLightbox'

interface PageHeroProps {
  title?: string
  titleKey?: string
  subtitle?: string
  subtitleKey?: string
  intro?: string
  introKey?: string
  height?: 'sm' | 'md' | 'lg'
  variant?: 'image' | 'gradient' | 'editorial' | 'content' | 'sacred'
  backgroundImage?: string
  gradientColor?: string
  showCircleMesh?: boolean
  imageUrl?: string
  sourceDomain?: string
  publishedDate?: string
  sourceUrl?: string
  /** Flower of Life geometry pattern — controls which derivative renders */
  sacredPattern?: 'seed' | 'vesica' | 'tripod' | 'flower' | 'metatron'
  children?: React.ReactNode
}

export function PageHero({
  title, titleKey, subtitle, subtitleKey,
  intro, introKey,
  height = 'md',
  variant,
  backgroundImage,
  gradientColor,
  showCircleMesh,
  imageUrl,
  sourceDomain,
  publishedDate,
  sourceUrl,
  sacredPattern = 'flower',
  children,
}: PageHeroProps) {
  const { t } = useTranslation()
  const displayTitle = titleKey ? t(titleKey) : (title ?? '')
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle
  const displayIntro = introKey ? t(introKey) : intro

  const resolvedVariant = variant ?? (backgroundImage ? 'image' : gradientColor ? 'gradient' : 'editorial')

  if (resolvedVariant === 'image') {
    const heightClass = height === 'sm' ? 'min-h-[160px] sm:min-h-[200px]' : height === 'lg' ? 'min-h-[280px] sm:min-h-[380px]' : 'min-h-[200px] sm:min-h-[280px]'
    return (
      <section className={`relative ${heightClass} w-full overflow-hidden flex items-end`}>
        <Image src={backgroundImage!} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
        <div className="relative w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white drop-shadow-lg">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-base sm:text-lg text-gray-200 mt-2 max-w-2xl drop-shadow">{displaySubtitle}</p>
          )}
          {displayIntro && (
            <p className="text-sm sm:text-base text-gray-300 mt-3 max-w-3xl leading-relaxed">{displayIntro}</p>
          )}
        </div>
      </section>
    )
  }

  if (resolvedVariant === 'gradient') {
    const gc = gradientColor || '#E8723A'
    return (
      <section className="relative w-full overflow-hidden bg-brand-bg-alt border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: gc }} />
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: gc, opacity: 0.4 }} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-brand-text leading-tight">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-base sm:text-lg text-brand-muted mt-2 max-w-2xl font-display italic">{displaySubtitle}</p>
          )}
          {displayIntro && (
            <p className="text-sm sm:text-base text-brand-muted mt-4 max-w-3xl leading-relaxed">{displayIntro}</p>
          )}
        </div>
        {/* Bottom color bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${gc}, transparent 60%)` }} />
      </section>
    )
  }

  if (resolvedVariant === 'content') {
    const gc = gradientColor || '#E8723A'
    return (
      <section className="relative w-full overflow-hidden bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-10">
            <div className="flex-1 min-w-0">
              {children && <div className="flex items-center gap-2 mb-4">{children}</div>}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-brand-text leading-tight">
                {displayTitle}
              </h1>
              {displaySubtitle && (
                <p className="text-base sm:text-lg text-brand-muted mt-3 max-w-2xl leading-relaxed">{displaySubtitle}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-brand-muted mt-4">
                {sourceDomain && <span className="font-medium">{sourceDomain}</span>}
                {sourceDomain && publishedDate && <span className="opacity-40">/</span>}
                {publishedDate && <span>{publishedDate}</span>}
              </div>
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: gc }}
                >
                  Visit source
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
            {imageUrl && (
              <div className="mt-6 lg:mt-0 lg:flex-shrink-0 lg:w-80 xl:w-96">
                <div className=" overflow-hidden shadow-lg">
                  <ImageLightbox src={imageUrl} alt={displayTitle} className="w-full h-48 sm:h-56 lg:h-64 object-contain bg-brand-bg" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${gc}, transparent 60%)` }} />
      </section>
    )
  }

  // Sacred geometry variant — light background with subtle geometry
  if (resolvedVariant === 'sacred') {
    const gc = gradientColor || '#E8723A'
    return (
      <section className="relative w-full overflow-hidden bg-brand-bg-alt border-b border-brand-border">
        {/* Sacred geometry background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <SacredGeometryBg pattern={sacredPattern} color={gc} />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: gc }} />
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: gc, opacity: 0.4 }} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-brand-text leading-tight">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-lg text-brand-muted mt-3 font-display italic max-w-2xl">{displaySubtitle}</p>
          )}
          {displayIntro && (
            <p className="text-base text-brand-muted mt-4 max-w-3xl leading-relaxed">{displayIntro}</p>
          )}
          {children}
        </div>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${gc}, transparent 60%)` }} />
      </section>
    )
  }

  // Editorial variant — the default for listing pages (light)
  return (
    <section className="relative w-full overflow-hidden bg-brand-bg-alt border-b border-brand-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="w-10 h-0.5 bg-brand-accent mb-5" />
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-brand-text leading-tight">
          {displayTitle}
        </h1>
        {displaySubtitle && (
          <p className="text-lg text-brand-muted mt-2 font-display italic">{displaySubtitle}</p>
        )}
        {displayIntro && (
          <p className="text-base text-brand-muted mt-4 max-w-3xl leading-relaxed">{displayIntro}</p>
        )}
      </div>
    </section>
  )
}

/**
 * SVG sacred geometry background patterns derived from the Flower of Life.
 * Each pattern increases in complexity:
 *   seed (1+6)  →  vesica (2)  →  tripod (3)  →  flower (7)  →  metatron (13+lines)
 */
function SacredGeometryBg({ pattern, color }: { pattern: string; color: string }) {
  const r = 40 // base circle radius
  const cx = 300
  const cy = 120

  if (pattern === 'vesica') {
    return (
      <svg className="absolute right-0 top-0 w-[500px] h-[240px] opacity-[0.12]" viewBox="0 0 500 240" fill="none">
        <circle cx={cx - 20} cy={cy} r={r * 2} stroke={color} strokeWidth="1.5" />
        <circle cx={cx + 20} cy={cy} r={r * 2} stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }

  if (pattern === 'tripod') {
    return (
      <svg className="absolute right-0 top-0 w-[500px] h-[240px] opacity-[0.12]" viewBox="0 0 500 240" fill="none">
        <circle cx={cx} cy={cy - 30} r={r * 1.5} stroke={color} strokeWidth="1.5" />
        <circle cx={cx - 26} cy={cy + 15} r={r * 1.5} stroke={color} strokeWidth="1.5" />
        <circle cx={cx + 26} cy={cy + 15} r={r * 1.5} stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }

  if (pattern === 'seed') {
    // Seed of Life: center circle + 6 surrounding
    const angles = [0, 60, 120, 180, 240, 300]
    return (
      <svg className="absolute right-0 top-0 w-[600px] h-[280px] opacity-[0.10]" viewBox="0 0 600 280" fill="none">
        <circle cx={cx + 100} cy={cy + 20} r={r} stroke={color} strokeWidth="1.2" />
        {angles.map(function (deg) {
          const rad = (deg * Math.PI) / 180
          const x = cx + 100 + r * Math.cos(rad)
          const y = cy + 20 + r * Math.sin(rad)
          return <circle key={deg} cx={x} cy={y} r={r} stroke={color} strokeWidth="1" />
        })}
      </svg>
    )
  }

  if (pattern === 'metatron') {
    // Metatron's Cube: 13 circles + connecting lines
    const inner = [0, 60, 120, 180, 240, 300]
    const outer = [30, 90, 150, 210, 270, 330]
    const cxm = cx + 100
    const cym = cy + 20
    const pts: [number, number][] = [[cxm, cym]]
    inner.forEach(function (deg) {
      const rad = (deg * Math.PI) / 180
      pts.push([cxm + r * Math.cos(rad), cym + r * Math.sin(rad)])
    })
    outer.forEach(function (deg) {
      const rad = (deg * Math.PI) / 180
      pts.push([cxm + r * 1.73 * Math.cos(rad), cym + r * 1.73 * Math.sin(rad)])
    })
    return (
      <svg className="absolute right-0 top-0 w-[600px] h-[280px] opacity-[0.10]" viewBox="0 0 600 280" fill="none">
        {pts.map(function (p, i) {
          return <circle key={i} cx={p[0]} cy={p[1]} r={r * 0.6} stroke={color} strokeWidth="0.8" />
        })}
        {/* Connect all points */}
        {pts.map(function (p1, i) {
          return pts.slice(i + 1).map(function (p2, j) {
            return <line key={i + '-' + j} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={color} strokeWidth="0.3" opacity="0.5" />
          })
        })}
      </svg>
    )
  }

  // Default: Full Flower of Life — 7 overlapping circles
  const offsets = [
    [0, 0],
    [0, -r],
    [0, r],
    [r * 0.866, -r * 0.5],
    [r * 0.866, r * 0.5],
    [-r * 0.866, -r * 0.5],
    [-r * 0.866, r * 0.5],
  ]
  return (
    <svg className="absolute right-0 top-0 w-[600px] h-[280px] opacity-[0.10]" viewBox="0 0 600 280" fill="none">
      {offsets.map(function (o, i) {
        return <circle key={i} cx={cx + 100 + o[0]} cy={cy + 20 + o[1]} r={r} stroke={color} strokeWidth={i === 0 ? '1.5' : '1'} />
      })}
      {/* Outer bounding circle */}
      <circle cx={cx + 100} cy={cy + 20} r={r * 2} stroke={color} strokeWidth="0.5" opacity="0.4" />
    </svg>
  )
}
