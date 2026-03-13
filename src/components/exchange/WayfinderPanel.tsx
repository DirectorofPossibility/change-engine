'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { X, ExternalLink, Phone, Mail, Globe, MapPin, Clock, DollarSign, Users, Calendar, BookOpen, BarChart3, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

export interface PanelData {
  type: 'resource' | 'official' | 'policy' | 'service' | 'opportunity' | 'situation' | 'path'
  id: string
  title: string
  summary?: string
  description?: string
  center?: string
  orgName?: string
  orgId?: string
  sourceUrl?: string
  role?: string
  party?: string
  phone?: string
  email?: string
  website?: string
  status?: string
  body?: string
  billNumber?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  eligibility?: string
  fees?: string
  hours?: string
  startDate?: string | null
  endDate?: string | null
  isVirtual?: string | null
  registrationUrl?: string | null
  spotsAvailable?: number | null
  urgency?: string | null
  slug?: string | null
  difficulty?: string | null
  moduleCount?: number | null
  estimatedMinutes?: number | null
  themeId?: string | null
  pathwayColor?: string
  focusAreas?: Array<{ id: string; name: string }>
  relatedOfficials?: Array<{ id: string; name: string; role?: string }>
  relatedPolicies?: Array<{ id: string; name: string; status?: string }>
  relatedResources?: Array<{ id: string; title: string; center?: string }>
  relatedServices?: Array<{ id: string; name: string; orgName?: string }>
}

export interface WayfinderPanelProps {
  panel: PanelData | null
  onClose: () => void
  onNavigate?: (type: string, id: string) => void
}

const TYPE_LABEL_KEYS: Record<PanelData['type'], string> = {
  resource: 'wayfinder.type_resource',
  official: 'wayfinder.type_official',
  policy: 'wayfinder.type_policy',
  service: 'wayfinder.type_service',
  opportunity: 'wayfinder.type_opportunity',
  situation: 'wayfinder.type_situation',
  path: 'wayfinder.type_path',
}

const DETAIL_PATHS: Record<PanelData['type'], string | null> = {
  resource: '/content/',
  official: '/officials/',
  policy: '/policies/',
  service: '/services/',
  opportunity: null,
  situation: '/help/',
  path: '/learn/',
}

const DEFAULT_ACCENT = '#1a5030'

function labelStyle(color: string): React.CSSProperties {
  return {
    borderLeft: `3px solid ${color}`,
    paddingLeft: 6,
    color: color,
  }
}

function statusDotColor(status?: string): string {
  if (!status) return 'bg-gray-400'
  const lower = status.toLowerCase()
  if (lower.includes('enacted') || lower.includes('signed') || lower.includes('passed')) return 'bg-green-500'
  if (lower.includes('introduced') || lower.includes('pending') || lower.includes('committee')) return 'bg-yellow-500'
  if (lower.includes('vetoed') || lower.includes('failed') || lower.includes('dead')) return 'bg-red-500'
  return 'bg-gray-400'
}

function statusTextColor(status?: string): string {
  if (!status) return 'text-gray-600'
  const lower = status.toLowerCase()
  if (lower.includes('enacted') || lower.includes('signed') || lower.includes('passed')) return 'text-green-700'
  if (lower.includes('introduced') || lower.includes('pending') || lower.includes('committee')) return 'text-yellow-700'
  if (lower.includes('vetoed') || lower.includes('failed') || lower.includes('dead')) return 'text-red-700'
  return 'text-gray-600'
}

function PanelSection({
  title,
  accentColor,
  children,
}: {
  title: string
  accentColor: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-brand-border pt-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-brand-muted">
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function MiniCard({
  onClick,
  viewLabel,
  children,
}: {
  onClick?: () => void
  viewLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-brand-border rounded-md px-3 py-2.5 hover:shadow transition-shadow cursor-pointer group"
    >
      {children}
      <span className="block text-xs text-[#1a5030] font-medium mt-1 group-hover:underline">
        {viewLabel} &rsaquo;
      </span>
    </button>
  )
}

export function WayfinderPanel({ panel, onClose, onNavigate }: WayfinderPanelProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = panel !== null

  useEffect(function () {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      panelRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return function () {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleKeyDown = useCallback(function (e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Tab') {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onClose])

  const accent = panel?.pathwayColor ?? DEFAULT_ACCENT

  function handleNavigate(type: string, id: string) {
    if (onNavigate) {
      onNavigate(type, id)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={
          'fixed inset-0 bg-black/20 z-50 transition-opacity duration-300 ' +
          (isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={panel ? panel.title : 'Detail panel'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={
          'fixed right-0 top-0 h-full w-[90vw] sm:w-[460px] max-w-full bg-white shadow-2xl z-50 ' +
          'flex flex-col outline-none transition-transform duration-300 ease-in-out ' +
          (isOpen ? 'translate-x-0' : 'translate-x-full')
        }
      >
        {panel && (
          <>
            {/* Header bar */}
            <div className="flex-shrink-0 sticky top-0 bg-white border-b border-brand-border px-5 py-4 flex items-center gap-3 z-10">
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors"
              >
                <X size={16} />
              </button>
              <span
                className="text-xs font-bold tracking-[0.12em] uppercase flex-shrink-0"
                style={labelStyle(accent)}
              >
                {t(TYPE_LABEL_KEYS[panel.type])}
              </span>
              <h2 className="text-base font-semibold text-brand-text leading-snug line-clamp-2 min-w-0">
                {panel.title}
              </h2>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              <div className="space-y-3">
                {panel.summary && (
                  <p className="text-sm leading-relaxed text-brand-muted">
                    {panel.summary}
                  </p>
                )}

                {panel.description && (
                  <p className="text-sm leading-relaxed text-brand-text">
                    {panel.description}
                  </p>
                )}

                {panel.type === 'resource' && (
                  <div className="space-y-2">
                    {panel.center && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">{t('wayfinder.center_label')}</span> {panel.center}
                      </p>
                    )}
                    {panel.orgName && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">{t('wayfinder.organization_label')}</span>{' '}
                        {panel.orgId ? (
                          <Link
                            href={'/organizations/' + panel.orgId}
                            className="text-[#1a5030] hover:underline"
                          >
                            {panel.orgName}
                          </Link>
                        ) : (
                          panel.orgName
                        )}
                      </p>
                    )}
                    {panel.sourceUrl && (
                      <a
                        href={panel.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#1a5030] hover:underline"
                      >
                        <ExternalLink size={14} />
                        {t('wayfinder.view_source')}
                      </a>
                    )}
                  </div>
                )}

                {panel.type === 'official' && (
                  <div className="space-y-1.5">
                    {panel.role && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">{t('wayfinder.role_label')}</span> {panel.role}
                      </p>
                    )}
                    {panel.party && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">{t('wayfinder.party_label')}</span> {panel.party}
                      </p>
                    )}
                    {panel.phone && (
                      <a
                        href={'tel:' + panel.phone}
                        className="flex items-center gap-1.5 text-sm text-brand-text hover:text-[#1a5030] transition-colors"
                      >
                        <Phone size={14} className="text-brand-muted" />
                        {panel.phone}
                      </a>
                    )}
                    {panel.email && (
                      <a
                        href={'mailto:' + panel.email}
                        className="flex items-center gap-1.5 text-sm text-brand-text hover:text-[#1a5030] transition-colors"
                      >
                        <Mail size={14} className="text-brand-muted" />
                        {panel.email}
                      </a>
                    )}
                    {panel.website && (
                      <a
                        href={panel.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-[#1a5030] hover:underline"
                      >
                        <Globe size={14} />
                        {t('wayfinder.website')}
                      </a>
                    )}
                  </div>
                )}

                {panel.type === 'policy' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {panel.status && (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusTextColor(panel.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(panel.status)}`} />
                          {panel.status}
                        </span>
                      )}
                      {panel.billNumber && (
                        <span className="text-xs text-brand-muted font-mono">
                          {panel.billNumber}
                        </span>
                      )}
                    </div>
                    {panel.body && (
                      <p className="text-sm leading-relaxed text-brand-text">
                        {panel.body}
                      </p>
                    )}
                  </div>
                )}

                {panel.type === 'service' && (
                  <div className="space-y-1.5">
                    {(panel.address || panel.city) && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <MapPin size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>
                          {[panel.address, panel.city, panel.state, panel.zipCode]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    {panel.hours && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <Clock size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>{panel.hours}</span>
                      </div>
                    )}
                    {panel.eligibility && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <Users size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>
                          <span className="font-semibold">{t('wayfinder.eligibility_label')}</span> {panel.eligibility}
                        </span>
                      </div>
                    )}
                    {panel.fees && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <DollarSign size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>
                          <span className="font-semibold">{t('wayfinder.fees_label')}</span> {panel.fees}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {panel.type === 'opportunity' && (
                  <div className="space-y-1.5">
                    {panel.startDate && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <Calendar size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>
                          {new Date(panel.startDate).toLocaleDateString()}
                          {panel.endDate ? ' – ' + new Date(panel.endDate).toLocaleDateString() : ''}
                        </span>
                      </div>
                    )}
                    {(panel.address || panel.city || panel.isVirtual) && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <MapPin size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>
                          {panel.isVirtual === 'Yes'
                            ? t('wayfinder.virtual')
                            : [panel.address, panel.city].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {panel.spotsAvailable != null && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <Users size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>{panel.spotsAvailable} {t('wayfinder.spots_available')}</span>
                      </div>
                    )}
                    {panel.registrationUrl && (
                      <a
                        href={panel.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#1a5030] hover:underline mt-1"
                      >
                        <ExternalLink size={14} />
                        {t('wayfinder.register')}
                      </a>
                    )}
                  </div>
                )}

                {panel.type === 'situation' && (
                  <div className="space-y-2">
                    {panel.urgency && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-brand-muted" />
                        <span className="text-sm font-semibold text-brand-text">{panel.urgency}</span>
                      </div>
                    )}
                  </div>
                )}

                {panel.type === 'path' && (
                  <div className="space-y-1.5">
                    {panel.difficulty && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <BarChart3 size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>{panel.difficulty}</span>
                      </div>
                    )}
                    {panel.moduleCount != null && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <BookOpen size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>{panel.moduleCount} {t('wayfinder.modules')}</span>
                      </div>
                    )}
                    {panel.estimatedMinutes != null && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <Clock size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>{panel.estimatedMinutes} {t('wayfinder.min_estimated')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Focus areas — comma-separated text */}
              {panel.focusAreas && panel.focusAreas.length > 0 && (
                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-brand-muted mb-2">
                    {t('wayfinder.focus_areas')}
                  </h3>
                  <p className="text-xs italic text-brand-muted leading-relaxed">
                    {panel.focusAreas.map(function (fa, i) {
                      return (
                        <span key={fa.id}>
                          {i > 0 && <span className="mx-1">&middot;</span>}
                          <span style={{ color: accent }}>{fa.name}</span>
                        </span>
                      )
                    })}
                  </p>
                </div>
              )}

              {/* Related Officials */}
              {panel.relatedOfficials && panel.relatedOfficials.length > 0 && (
                <PanelSection title={t('wayfinder.related_officials')} accentColor={accent}>
                  {panel.relatedOfficials.map(function (official) {
                    return (
                      <MiniCard
                        key={official.id}
                        viewLabel={t('wayfinder.view_details')}
                        onClick={function () { handleNavigate('official', official.id) }}
                      >
                        <p className="text-sm font-semibold text-brand-text leading-snug">
                          {official.name}
                        </p>
                        {official.role && (
                          <p className="text-xs text-brand-muted mt-0.5">
                            {official.role}
                          </p>
                        )}
                      </MiniCard>
                    )
                  })}
                </PanelSection>
              )}

              {/* Related Policies */}
              {panel.relatedPolicies && panel.relatedPolicies.length > 0 && (
                <PanelSection title={t('wayfinder.related_policies')} accentColor={accent}>
                  {panel.relatedPolicies.map(function (policy) {
                    return (
                      <MiniCard
                        key={policy.id}
                        viewLabel={t('wayfinder.view_details')}
                        onClick={function () { handleNavigate('policy', policy.id) }}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-brand-text leading-snug min-w-0 flex-1">
                            {policy.name}
                          </p>
                          {policy.status && (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ${statusTextColor(policy.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(policy.status)}`} />
                              {policy.status}
                            </span>
                          )}
                        </div>
                      </MiniCard>
                    )
                  })}
                </PanelSection>
              )}

              {/* Related Resources */}
              {panel.relatedResources && panel.relatedResources.length > 0 && (
                <PanelSection title={t('wayfinder.related_resources')} accentColor={accent}>
                  {panel.relatedResources.map(function (resource) {
                    return (
                      <MiniCard
                        key={resource.id}
                        viewLabel={t('wayfinder.view_details')}
                        onClick={function () { handleNavigate('resource', resource.id) }}
                      >
                        <p className="text-sm font-semibold text-brand-text leading-snug">
                          {resource.title}
                        </p>
                        {resource.center && (
                          <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: accent }}
                            />
                            {resource.center}
                          </p>
                        )}
                      </MiniCard>
                    )
                  })}
                </PanelSection>
              )}

              {/* Related Services */}
              {panel.relatedServices && panel.relatedServices.length > 0 && (
                <PanelSection title={t('wayfinder.related_services')} accentColor={accent}>
                  {panel.relatedServices.map(function (service) {
                    return (
                      <MiniCard
                        key={service.id}
                        viewLabel={t('wayfinder.view_details')}
                        onClick={function () { handleNavigate('service', service.id) }}
                      >
                        <p className="text-sm font-semibold text-brand-text leading-snug">
                          {service.name}
                        </p>
                        {service.orgName && (
                          <p className="text-xs text-brand-muted mt-0.5">
                            {service.orgName}
                          </p>
                        )}
                      </MiniCard>
                    )
                  })}
                </PanelSection>
              )}
            </div>

            {/* Footer action */}
            {(function () {
              const detailPath = DETAIL_PATHS[panel.type]
              const detailHref = panel.type === 'situation'
                ? (detailPath + (panel.slug || ''))
                : detailPath
                  ? (detailPath + panel.id)
                  : null
              if (panel.type === 'opportunity' && panel.registrationUrl) {
                return (
                  <div className="flex-shrink-0 border-t border-brand-border px-5 py-4">
                    <a
                      href={panel.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center text-sm font-semibold py-3 rounded-md transition-colors"
                      style={{ backgroundColor: accent + '1a', color: accent }}
                      onMouseEnter={function (e) { e.currentTarget.style.backgroundColor = accent + '33' }}
                      onMouseLeave={function (e) { e.currentTarget.style.backgroundColor = accent + '1a' }}
                    >
                      {t('wayfinder.register')}
                    </a>
                  </div>
                )
              }
              if (!detailHref) return null
              return (
                <div className="flex-shrink-0 border-t border-brand-border px-5 py-4">
                  <Link
                    href={detailHref}
                    className="block w-full text-center text-sm font-semibold py-3 rounded-md transition-colors"
                    style={{ backgroundColor: accent + '1a', color: accent }}
                    onMouseEnter={function (e) { e.currentTarget.style.backgroundColor = accent + '33' }}
                    onMouseLeave={function (e) { e.currentTarget.style.backgroundColor = accent + '1a' }}
                  >
                    {t('wayfinder.view_full_profile')}
                  </Link>
                </div>
              )
            })()}
          </>
        )}
      </div>
    </>
  )
}
