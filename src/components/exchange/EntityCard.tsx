'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, Globe, Linkedin, MapPin, Calendar, Users } from 'lucide-react'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { FolFallback } from '@/components/ui/FolFallback'
import { useTranslation } from '@/lib/use-translation'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'

/* ─── Shared types ───────────────────────────── */

interface BaseProps {
  onSelect?: () => void
}

interface ContentProps extends BaseProps {
  variant: 'content'
  id: string
  title: string
  summary: string
  pathway: string | null
  center: string | null
  publishedAt: string | null
  imageUrl?: string | null
  href?: string
  translatedTitle?: string
  translatedSummary?: string
}

interface OfficialProps extends BaseProps {
  variant: 'official'
  id: string
  name: string
  title?: string | null
  party?: string | null
  level?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  photoUrl?: string | null
  linkedinUrl?: string | null
  translatedTitle?: string
}

interface ServiceProps extends BaseProps {
  variant: 'service'
  serviceId?: string
  name: string
  orgName?: string
  orgId?: string
  description?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  website?: string | null
  translatedName?: string
  translatedDescription?: string
}

interface PolicyProps extends BaseProps {
  variant: 'policy'
  name: string
  summary?: string | null
  billNumber?: string | null
  status?: string | null
  level?: string | null
  sourceUrl?: string | null
  translatedName?: string
  translatedSummary?: string
  impactPreview?: string | null
  lastActionDate?: string | null
}

interface CandidateProps extends BaseProps {
  variant: 'candidate'
  name: string
  party?: string | null
  incumbent?: string | null
  officeSought?: string | null
  district?: string | null
  bioSummary?: string | null
  campaignWebsite?: string | null
  linkedinUrl?: string | null
  policyPositions?: string | null
  endorsements?: string | null
}

interface OpportunityProps extends BaseProps {
  variant: 'opportunity'
  name: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  address?: string | null
  city?: string | null
  isVirtual?: string | null
  registrationUrl?: string | null
  spotsAvailable?: number | null
  translatedName?: string
  translatedDescription?: string
}

type EntityCardProps =
  | ContentProps
  | OfficialProps
  | ServiceProps
  | PolicyProps
  | CandidateProps
  | OpportunityProps

/* ─── Helpers ────────────────────────────────── */

function statusDotColor(status: string | null): string {
  if (!status) return '#9B9590'
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return '#2D8659'
  if (s === 'pending' || s === 'introduced' || s === 'in committee') return '#C47D1A'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return '#C53030'
  return '#9B9590'
}

function recencyLabel(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 0) return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return days + 'd ago'
  if (days < 30) return Math.floor(days / 7) + 'w ago'
  return null
}

/* ─── Wrapper for click / link behavior ──────── */

function CardShell({ href, onSelect, children, className }: {
  href?: string
  onSelect?: () => void
  children: React.ReactNode
  className?: string
}) {
  const base = 'block bg-white border border-rule overflow-hidden hover:border-ink transition-colors ' + (className || '')

  if (onSelect) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
        className={base + ' cursor-pointer'}
      >
        {children}
      </div>
    )
  }

  if (href) {
    return <Link href={href} className={base}>{children}</Link>
  }

  return <div className={base}>{children}</div>
}

/* ─── Variant renderers ──────────────────────── */

function ContentVariant(props: ContentProps) {
  const { t } = useTranslation()
  const displayTitle = props.translatedTitle || props.title
  const raw = props.translatedSummary || props.summary
  const displaySummary = raw.length > 150 ? raw.slice(0, 150) + '...' : raw

  return (
    <CardShell href={props.onSelect ? undefined : (props.href || '/content/' + props.id)} onSelect={props.onSelect}>
      {props.imageUrl ? (
        <div className="w-full h-36 relative border-b border-rule">
          <Image src={props.imageUrl} alt={displayTitle} width={400} height={144} className="w-full h-full object-cover" />
        </div>
      ) : (
        <FolFallback pathway={props.pathway} />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <ThemePill themeId={props.pathway} size="sm" linkable={false} />
          <CenterBadge center={props.center} linkable={false} />
        </div>
        <h3 className="font-body text-[0.95rem] leading-snug font-semibold text-ink line-clamp-2 mb-1">
          {displayTitle}
        </h3>
        <p className="font-body text-[0.8rem] leading-relaxed text-muted line-clamp-2 mb-2">
          {displaySummary}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-micro uppercase tracking-wider text-muted">
            {props.publishedAt ? new Date(props.publishedAt).toLocaleDateString() : ''}
          </span>
          <span className="font-mono text-micro uppercase tracking-wider text-blue">
            {t('card.read_more')} &rarr;
          </span>
        </div>
      </div>
    </CardShell>
  )
}

function OfficialVariant(props: OfficialProps) {
  const { t } = useTranslation()
  const displayTitle = props.translatedTitle || props.title
  const levelColor = (props.level && LEVEL_COLORS[props.level]) || DEFAULT_LEVEL_COLOR

  return (
    <CardShell href={props.onSelect ? undefined : '/officials/' + props.id} onSelect={props.onSelect} className="group">
      {/* Level color bar */}
      <div className="h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: levelColor }} />

      <div className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0">
          {props.photoUrl ? (
            <Image
              src={props.photoUrl.replace(/^http:\/\//, 'https://')}
              alt={props.name}
              className="w-[72px] h-[72px] object-cover object-top"
              width={72}
              height={72}
            />
          ) : (
            <div className="w-[72px] h-[72px] flex items-center justify-center" style={{ backgroundColor: levelColor + '10' }}>
              <span className="text-2xl font-display font-bold" style={{ color: levelColor }}>{props.name.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-body text-[0.95rem] leading-snug font-semibold text-ink group-hover:underline">{props.name}</h3>
          {displayTitle && <p className="font-body text-[0.8rem] leading-relaxed text-muted line-clamp-2 mt-0.5">{displayTitle}</p>}
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {props.level && (
              <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wide" style={{ color: levelColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: levelColor }} />
                {props.level}
              </span>
            )}
            {props.party && props.level && <span className="text-muted">&middot;</span>}
            {props.party && <span className="text-muted">{props.party}</span>}
          </div>
        </div>
      </div>

      {/* Contact actions */}
      <div className="flex items-center gap-3 flex-wrap px-4 pb-3 pt-0">
        {props.email && (
          <a href={'mailto:' + props.email} className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Mail size={13} /> {t('card.email')}
          </a>
        )}
        {props.phone && (
          <a href={'tel:' + props.phone} className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Phone size={13} /> {t('card.call')}
          </a>
        )}
        {props.website && (
          <a href={props.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Globe size={13} /> {t('card.website')}
          </a>
        )}
        {props.linkedinUrl && (
          <a href={props.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Linkedin size={13} /> LinkedIn
          </a>
        )}
      </div>
    </CardShell>
  )
}

function ServiceVariant(props: ServiceProps) {
  const { t } = useTranslation()
  const fullAddress = [props.address, props.city, props.state, props.zipCode].filter(Boolean).join(', ')
  const displayName = props.translatedName || props.name
  const displayDesc = props.translatedDescription || props.description

  return (
    <CardShell href={props.onSelect ? undefined : (props.serviceId ? '/services/' + props.serviceId : undefined)} onSelect={props.onSelect} className="h-full">
      <div className="p-5">
        <h3 className="font-semibold text-ink mb-1 line-clamp-2">{displayName}</h3>
        {props.orgName && props.orgId ? (
          <Link href={'/organizations/' + props.orgId} className="text-xs text-blue hover:underline mb-2 block" onClick={function (e) { e.stopPropagation() }}>
            {props.orgName}
          </Link>
        ) : props.orgName ? (
          <p className="text-xs text-muted mb-2">{props.orgName}</p>
        ) : null}
        {displayDesc && <p className="text-sm text-muted mb-3 line-clamp-2">{displayDesc}</p>}
        <div className="space-y-1.5">
          {props.phone && (
            <a href={'tel:' + props.phone} className="flex items-center gap-2 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
              <Phone size={14} /> {props.phone}
            </a>
          )}
          {fullAddress && (
            <a
              href={'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(fullAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-blue hover:underline"
              onClick={function (e) { e.stopPropagation() }}
            >
              <MapPin size={14} className="shrink-0" /> {fullAddress}
            </a>
          )}
          {props.website && (
            <a href={props.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
              <Globe size={14} /> {t('card.website')}
            </a>
          )}
        </div>
      </div>
    </CardShell>
  )
}

function PolicyVariant(props: PolicyProps) {
  const { t } = useTranslation()
  const displayName = props.translatedName || props.name
  const displaySummary = props.translatedSummary || props.summary
  const levelColor = (props.level && LEVEL_COLORS[props.level]) || DEFAULT_LEVEL_COLOR
  const recency = recencyLabel(props.lastActionDate)

  return (
    <CardShell onSelect={props.onSelect} className="hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Level color bar */}
      <div className="h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: levelColor }} />

      <div className="p-4">
        {/* Top row: bill number + status + recency */}
        <div className="flex items-center gap-2 mb-2">
          {props.billNumber && (
            <span className="text-micro font-mono font-medium text-muted bg-paper px-1.5 py-0.5">{props.billNumber}</span>
          )}
          {props.status && (
            <span className="inline-flex items-center gap-1.5 text-micro font-semibold" style={{ color: statusDotColor(props.status) }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDotColor(props.status) }} />
              {props.status}
            </span>
          )}
          {recency && (
            <span className="ml-auto text-[10px] font-mono font-bold text-blue bg-blue/10 px-1.5 py-0.5">
              {recency}
            </span>
          )}
        </div>

        <h4 className="font-bold text-ink text-sm mb-1.5 line-clamp-2 leading-snug group-hover:text-blue transition-colors">{displayName}</h4>

        {displaySummary && (
          <p className="text-xs text-muted mb-2 line-clamp-2 leading-relaxed">{displaySummary}</p>
        )}

        {props.impactPreview && (
          <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 mb-2 line-clamp-1 border border-amber-200">{props.impactPreview}</p>
        )}

        <div className="flex items-center justify-between">
          {props.level && (
            <span className="inline-flex items-center gap-1 text-micro font-bold uppercase tracking-wide" style={{ color: levelColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: levelColor }} />
              {props.level}
            </span>
          )}
          <div className="flex items-center gap-3">
            <Link
              href="/officials/lookup"
              className="text-xs text-muted hover:text-blue hover:underline font-medium"
              onClick={function (e) { e.stopPropagation() }}
            >
              {t('card.contact_rep') || 'Contact your rep'}
            </Link>
            {props.sourceUrl && (
              <Link
                href={props.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue hover:underline font-medium"
                onClick={function (e) { e.stopPropagation() }}
              >
                {t('card.view_source')} &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </CardShell>
  )
}

function CandidateVariant(props: CandidateProps) {
  return (
    <CardShell onSelect={props.onSelect}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-semibold text-ink">{props.name}</h4>
          {props.incumbent === 'Yes' && (
            <span className="text-xs uppercase tracking-wide font-semibold text-blue">Incumbent</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
          {props.party && <span>{props.party}</span>}
          {props.party && props.officeSought && <span>&middot;</span>}
          {props.officeSought && <span>{props.officeSought}</span>}
          {props.district && <span>({props.district})</span>}
        </div>
        {props.bioSummary && <p className="text-sm text-muted mb-2 line-clamp-3">{props.bioSummary}</p>}
        {props.policyPositions && <p className="text-xs text-muted mb-2 line-clamp-2">Positions: {props.policyPositions}</p>}
        {props.endorsements && <p className="text-xs text-muted mb-2 line-clamp-1">Endorsements: {props.endorsements}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          {props.campaignWebsite && (
            <Link href={props.campaignWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue hover:underline">
              <Globe size={12} /> Campaign website
            </Link>
          )}
          {props.linkedinUrl && (
            <Link href={props.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue hover:underline">
              <Linkedin size={12} /> LinkedIn
            </Link>
          )}
        </div>
      </div>
    </CardShell>
  )
}

function OpportunityVariant(props: OpportunityProps) {
  const { t } = useTranslation()
  const location = props.isVirtual === 'Yes' ? t('card.virtual') : [props.address, props.city].filter(Boolean).join(', ')
  const displayName = props.translatedName || props.name
  const displayDesc = props.translatedDescription || props.description

  return (
    <CardShell onSelect={props.onSelect}>
      <div className="p-4">
        <h4 className="font-semibold text-ink text-sm mb-2 line-clamp-2">{displayName}</h4>
        {displayDesc && (
          <p className="text-xs text-muted mb-3 line-clamp-2">{displayDesc}</p>
        )}
        <div className="space-y-1.5 text-xs text-muted">
          {props.startDate && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>
                {new Date(props.startDate).toLocaleDateString()}
                {props.endDate ? ' - ' + new Date(props.endDate).toLocaleDateString() : ''}
              </span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} />
              {props.isVirtual !== 'Yes' && props.address ? (
                <a
                  href={'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue hover:underline line-clamp-1"
                  onClick={function (e) { e.stopPropagation() }}
                >
                  {location}
                </a>
              ) : (
                <span className="line-clamp-1">{location}</span>
              )}
            </div>
          )}
          {props.spotsAvailable != null && (
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              <span>{props.spotsAvailable} {t('card.spots_available')}</span>
            </div>
          )}
        </div>
        {props.registrationUrl && (
          <Link
            href={props.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs text-blue hover:underline"
            onClick={function (e) { e.stopPropagation() }}
          >
            {t('card.register')} &rarr;
          </Link>
        )}
      </div>
    </CardShell>
  )
}

/* ─── Main component ─────────────────────────── */

export function EntityCard(props: EntityCardProps) {
  switch (props.variant) {
    case 'content': return <ContentVariant {...props} />
    case 'official': return <OfficialVariant {...props} />
    case 'service': return <ServiceVariant {...props} />
    case 'policy': return <PolicyVariant {...props} />
    case 'candidate': return <CandidateVariant {...props} />
    case 'opportunity': return <OpportunityVariant {...props} />
  }
}
