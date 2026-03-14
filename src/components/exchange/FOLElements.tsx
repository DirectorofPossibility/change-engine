'use client'

/**
 * @fileoverview FOL (Flower of Life) design elements used throughout the platform.
 *
 * The FOL is the DNA of the visual language — it appears as:
 *  - Bullet points (FOLBullet)
 *  - Section dividers (FOLDivider)
 *  - Button icons (FOLButton)
 *  - Background depth layers (FOLDepthLayer)
 *  - Glassmorphic card accents (FOLGlassCard)
 *  - Stat counters (FOLStat)
 */

import { useId } from 'react'
import Link from 'next/link'

// ── Shared gradient animation ─────────────────────────────────────

const BRAND_COLORS = '#1a6b56;#1b5e8a;#3a4a2a;#5c2d3e;#4a2870;#1a6b56'

function AnimatedGradient({ id, dur = 8 }: { id: string; dur?: number }) {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a6b56">
          <animate attributeName="stop-color" values={BRAND_COLORS} dur={`${dur}s`} repeatCount="indefinite" />
        </stop>
        <stop offset="100%" stopColor="#3a4a2a">
          <animate attributeName="stop-color" values="#3a4a2a;#5c2d3e;#4a2870;#1a6b56;#1b5e8a;#3a4a2a" dur={`${dur}s`} repeatCount="indefinite" />
        </stop>
      </linearGradient>
    </defs>
  )
}

// ── FOL Bullet — replaces standard list bullets ───────────────────

export function FOLBullet({ size = 12, color, className = '' }: { size?: number; color?: string; className?: string }) {
  const r = 4, cx = 10, cy = 10
  return (
    <svg width={size} height={size} viewBox="2 2 16 16" fill="none" className={`inline-block flex-shrink-0 ${className}`} aria-hidden="true">
      {/* Seed of Life — 7 circles */}
      <circle cx={cx} cy={cy} r={r} stroke={color || '#C75B2A'} strokeWidth="1.2" opacity="0.9" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        return (
          <circle
            key={i}
            cx={cx + r * Math.cos(rad)}
            cy={cy + r * Math.sin(rad)}
            r={r}
            stroke={color || '#C75B2A'}
            strokeWidth="0.8"
            opacity="0.4"
          />
        )
      })}
      <circle cx={cx} cy={cy} r="1.5" fill={color || '#C75B2A'} opacity="0.6" />
    </svg>
  )
}

// ── FOL Section Divider ───────────────────────────────────────────

export function FOLSectionDivider({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const gradId = `fol-div-${id}`

  return (
    <div className={`w-full flex items-center gap-4 my-8 ${className}`} aria-hidden="true">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />
      <svg width="40" height="40" viewBox="2 2 16 16" fill="none" className="opacity-30" style={{ animation: 'fol-spin 60s linear infinite' }}>
        <AnimatedGradient id={gradId} dur={10} />
        <circle cx="10" cy="10" r="4" stroke={`url(#${gradId})`} strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={`url(#${gradId})`} strokeWidth="1" opacity="0.6" />
        })}
      </svg>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />
    </div>
  )
}

// ── FOL Button — CTA with FOL icon ────────────────────────────────

export function FOLButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
}) {
  const base = 'inline-flex items-center gap-2.5 font-display font-bold transition-all duration-300 group'
  const variants = {
    primary: 'px-5 py-2.5 bg-brand-accent text-white font-mono uppercase hover:opacity-90 transition-opacity',
    secondary: 'px-5 py-2.5 border-2 border-blue bg-transparent text-blue font-mono uppercase hover:bg-blue/5 transition-colors',
    ghost: 'text-brand-accent hover:underline transition-colors',
  }

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      <svg width="18" height="18" viewBox="2 2 16 16" fill="none" className="opacity-70 group-hover:opacity-100 transition-opacity group-hover:rotate-[30deg] transition-transform duration-500" aria-hidden="true">
        <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        })}
      </svg>
      {children}
    </Link>
  )
}

// ── FOL Depth Layer — background decoration ───────────────────────

export function FOLDepthLayer({
  position = 'top-right',
  size = 600,
  opacity = 0.06,
  spin = true,
}: {
  position?: 'top-right' | 'bottom-left' | 'center' | 'top-left' | 'bottom-right'
  size?: number
  opacity?: number
  spin?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const gradId = `fol-depth-${id}`

  const posStyles: Record<string, React.CSSProperties> = {
    'top-right': { top: `-${size * 0.2}px`, right: `-${size * 0.2}px` },
    'bottom-left': { bottom: `-${size * 0.2}px`, left: `-${size * 0.2}px` },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'top-left': { top: `-${size * 0.2}px`, left: `-${size * 0.2}px` },
    'bottom-right': { bottom: `-${size * 0.2}px`, right: `-${size * 0.2}px` },
  }

  const r = 18, cx = 50, cy = 50

  return (
    <div
      className="absolute pointer-events-none z-0"
      style={{ width: `${size}px`, height: `${size}px`, opacity, ...posStyles[position] }}
    >
      <svg viewBox="0 0 100 100" fill="none" style={spin ? { animation: 'fol-spin 90s linear infinite' } : undefined}>
        <AnimatedGradient id={gradId} dur={14} />
        <circle cx={cx} cy={cy} r={r * 2.2} stroke={`url(#${gradId})`} strokeWidth="0.8" opacity="0.4" />
        <circle cx={cx} cy={cy} r={r} stroke={`url(#${gradId})`} strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <circle key={`i${i}`} cx={cx + r * Math.cos(rad)} cy={cy + r * Math.sin(rad)} r={r} stroke={`url(#${gradId})`} strokeWidth="1" opacity="0.7" />
        })}
        {[30, 90, 150, 210, 270, 330].map((deg, i) => {
          const outerR = r * 1.732
          const rad = (deg * Math.PI) / 180
          return <circle key={`o${i}`} cx={cx + outerR * Math.cos(rad)} cy={cy + outerR * Math.sin(rad)} r={r} stroke={`url(#${gradId})`} strokeWidth="0.8" opacity="0.4" />
        })}
        <circle cx={cx} cy={cy} r="2.5" fill={`url(#${gradId})`} opacity="0.5" />
      </svg>
    </div>
  )
}

// ── FOL Glass Card — glassmorphic card with FOL accent ────────────

export function FOLGlassCard({
  children,
  href,
  accentColor = '#C75B2A',
  className = '',
}: {
  children: React.ReactNode
  href?: string
  accentColor?: string
  className?: string
}) {
  const content = (
    <div
      className={`relative overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:border-ink group ${className}`}
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: accentColor + '30',
              }}
    >
      {/* FOL watermark in corner */}
      <div className="absolute -top-4 -right-4 w-24 h-24 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" style={{ animation: 'fol-spin 60s linear infinite' }}>
        <svg viewBox="2 2 16 16" fill="none">
          <circle cx="10" cy="10" r="4" stroke={accentColor} strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={accentColor} strokeWidth="0.8" />
          })}
        </svg>
      </div>
      {children}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}

// ── FOL Stat — animated stat counter with FOL background ──────────

export function FOLStat({
  value,
  label,
  color = '#C75B2A',
}: {
  value: string | number
  label: string
  color?: string
}) {
  return (
    <div className="relative text-center">
      {/* Tiny FOL behind the number */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
        <svg width="60" height="60" viewBox="2 2 16 16" fill="none" style={{ animation: 'fol-spin 30s linear infinite' }}>
          <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={color} strokeWidth="1" />
          })}
        </svg>
      </div>
      <span className="relative block text-3xl font-black leading-none" style={{ color }}>{value}</span>
      <span className="relative block font-mono text-[9px] font-bold uppercase tracking-wider text-brand-muted mt-1">{label}</span>
    </div>
  )
}
