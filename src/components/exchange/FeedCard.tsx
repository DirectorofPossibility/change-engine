'use client'

import Link from 'next/link'
import { ChevronRight, BookOpen, Zap, Package, Scale } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { CENTER_COLORS } from '@/lib/constants'
import { ImageLightbox } from './ImageLightbox'
import { FolFallback } from '@/components/ui/FolFallback'

export interface FeedItem {
  type: 'resource' | 'official' | 'policy' | 'service'
  id: string
  title: string
  summary?: string
  center?: string
  orgName?: string
  role?: string
  status?: string
  body?: string
  relevance?: string
  pathwayColor?: string
  imageUrl?: string
  href?: string
}

interface FeedCardProps {
  item: FeedItem
  onClick?: () => void
  variant?: 'grid' | 'list'
}

const DEFAULT_ACCENT = '#8B7E74'
const TEAL = '#1a5030'

const CENTER_ICONS: Record<string, typeof BookOpen> = {
  Learning: BookOpen,
  Action: Zap,
  Resource: Package,
  Accountability: Scale,
}

const GRADIENT_PAIRS: Record<string, [string, string]> = {
  THEME_01: ['#7a2018', '#5a1810'],
  THEME_02: ['#1e4d7a', '#163a5c'],
  THEME_03: ['#4a2870', '#381e54'],
  THEME_04: ['#1a6b56', '#145242'],
  THEME_05: ['#1b5e8a', '#144868'],
  THEME_06: ['#1a5030', '#133d24'],
  THEME_07: ['#4a2870', '#381e54'],
}

function policyAccentColor(status?: string): string {
  if (!status) return DEFAULT_ACCENT
  const s = status.toLowerCase()
  if (s === 'active' || s === 'passed' || s === 'enacted' || s === 'signed') return '#1a6b56'
  if (s === 'proposed' || s === 'pending' || s === 'introduced' || s === 'in committee') return '#4a2870'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return '#7a2018'
  return DEFAULT_ACCENT
}

function statusDotColor(status?: string): string {
  if (!status) return 'bg-gray-400'
  const s = status.toLowerCase()
  if (s === 'active' || s === 'passed' || s === 'enacted' || s === 'signed') return 'bg-green-500'
  if (s === 'proposed' || s === 'pending' || s === 'introduced' || s === 'in committee') return 'bg-amber-500'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return 'bg-red-500'
  return 'bg-gray-400'
}

function statusTextColor(status?: string): string {
  if (!status) return 'text-gray-600'
  const s = status.toLowerCase()
  if (s === 'active' || s === 'passed' || s === 'enacted' || s === 'signed') return 'text-green-700'
  if (s === 'proposed' || s === 'pending' || s === 'introduced' || s === 'in committee') return 'text-amber-700'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return 'text-red-700'
  return 'text-gray-600'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function ResourceCard({ item, variant, t }: { item: FeedItem; variant: 'grid' | 'list'; t: (key: string) => string }) {
  const accent = item.pathwayColor || DEFAULT_ACCENT
  const CenterIcon = item.center ? CENTER_ICONS[item.center] : null
  const centerColor = item.center ? CENTER_COLORS[item.center] : accent

  if (variant === 'grid') {
    return (
      <div className="group bg-white rounded-card border border-brand-border overflow-hidden card-lift">
        {/* Image area */}
        <div className="relative h-44 overflow-hidden">
          {item.imageUrl ? (
            <ImageLightbox
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-contain bg-brand-bg group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <FolFallback height="h-full" />
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          {/* Center label */}
          {item.center && CenterIcon && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-xs font-semibold backdrop-blur-sm"
              style={{ backgroundColor: centerColor + 'CC' }}
            >
              <CenterIcon size={12} />
              {item.center}
            </div>
          )}
          {/* Source domain */}
          {item.orgName && (
            <div className="absolute bottom-2 left-3 text-white/90 text-xs font-medium truncate max-w-[80%]">
              {item.orgName}
            </div>
          )}
        </div>
        {/* Content */}
        <div className="p-4">
          <h4 className="font-semibold text-brand-text leading-snug line-clamp-2 text-[15px]">
            {item.title}
          </h4>
          {item.summary && (
            <p className="text-sm text-brand-muted mt-1.5 leading-relaxed line-clamp-2">
              {item.summary.length > 150 ? item.summary.slice(0, 150) + '...' : item.summary}
            </p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-xs text-brand-muted">{t('card.explore')}</span>
            </div>
            <span className="text-xs font-semibold inline-flex items-center gap-0.5" style={{ color: accent }}>
              {t('card.read_more')}
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    )
  }

  // List variant
  return (
    <div className="group flex bg-white border border-brand-border overflow-hidden card-lift">
      {item.imageUrl && (
        <div className="w-28 sm:w-36 flex-shrink-0 overflow-hidden">
          <ImageLightbox
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain bg-brand-bg group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="flex-1 min-w-0 p-4">
        {item.center && CenterIcon && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <CenterIcon size={12} style={{ color: centerColor }} />
            <span className="text-xs uppercase tracking-wide font-medium" style={{ color: centerColor }}>
              {item.center}
            </span>
          </div>
        )}
        <h4 className="text-base font-bold text-brand-text leading-snug line-clamp-2">{item.title}</h4>
        {item.summary && (
          <p className="text-sm text-brand-muted mt-1 leading-relaxed line-clamp-2">{item.summary}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {item.orgName && <span className="text-xs text-brand-muted truncate mr-2">{item.orgName}</span>}
          <span className="text-sm font-semibold flex-shrink-0 inline-flex items-center gap-0.5" style={{ color: accent }}>
            {t('card.open')} <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  )
}

function OfficialCard({ item, t }: { item: FeedItem; t: (key: string) => string }) {
  const initials = getInitials(item.title)
  return (
    <div className="group bg-white border border-brand-border overflow-hidden card-lift">
      <div className="p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: TEAL + '18' }}>
          <span className="text-lg font-bold" style={{ color: TEAL }}>{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs uppercase tracking-wider font-bold block mb-0.5" style={{ color: TEAL }}>
            {t('card.civic_leader')}
          </span>
          <h4 className="text-base font-bold text-brand-text leading-snug line-clamp-1">{item.title}</h4>
          {item.role && <p className="text-sm text-brand-muted leading-snug line-clamp-1">{item.role}</p>}
        </div>
        <ChevronRight className="w-5 h-5 flex-shrink-0 text-brand-muted group-hover:text-brand-text transition-colors" />
      </div>
    </div>
  )
}

function PolicyCard({ item, t }: { item: FeedItem; t: (key: string) => string }) {
  const accent = policyAccentColor(item.status)
  return (
    <div className="group bg-white border border-brand-border overflow-hidden card-lift">
      <div className="p-4" style={{ borderLeft: `4px solid ${accent}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Scale size={14} style={{ color: accent }} />
          <span className="text-xs uppercase tracking-wider font-bold" style={{ color: accent }}>{t('card.policy')}</span>
          {item.status && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusTextColor(item.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(item.status)}`} />
              {item.status}
            </span>
          )}
        </div>
        <h4 className="text-base font-bold text-brand-text leading-snug line-clamp-2">{item.title}</h4>
        {item.body && (
          <p className="text-xs text-brand-muted mt-1.5">
            {t('card.level')} <span className="font-medium">{item.body}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export function FeedCard({ item, onClick, variant = 'list' }: FeedCardProps) {
  const { t } = useTranslation()
  const Wrapper = item.href ? Link : 'div'
  const wrapperProps = item.href ? { href: item.href } : {}

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className="block cursor-pointer"
      onClick={onClick}
    >
      {(item.type === 'resource' || item.type === 'service') && <ResourceCard item={item} variant={variant} t={t} />}
      {item.type === 'official' && <OfficialCard item={item} t={t} />}
      {item.type === 'policy' && <PolicyCard item={item} t={t} />}
    </Wrapper>
  )
}
