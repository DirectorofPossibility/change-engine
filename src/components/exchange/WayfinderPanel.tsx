/**
 * @fileoverview Slide-out detail panel for the Community Exchange wayfinder.
 *
 * Opens from the right edge of the viewport when a user clicks a feed card.
 * Displays full entity details (resource, official, policy, or service) along
 * with its knowledge-mesh connections -- related items from other entity types
 * that share focus areas or organizational links.
 *
 * Accessibility: focus trap, Escape key dismissal, backdrop click to close,
 * body scroll lock, `role="dialog"` + `aria-modal="true"`.
 *
 * The panel accepts an `onNavigate` callback so the parent can swap in a
 * different entity without unmounting the panel (drill-through navigation).
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { X, ExternalLink, Phone, Mail, Globe, MapPin, Clock, DollarSign, Users, Calendar, BookOpen, BarChart3, AlertTriangle } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────

/** Shape of a single entity displayed in the panel, including mesh connections. */
export interface PanelData {
  type: 'resource' | 'official' | 'policy' | 'service' | 'opportunity' | 'situation' | 'path'
  id: string
  title: string
  summary?: string
  /** Full description. */
  description?: string
  /** For resources. */
  center?: string
  orgName?: string
  orgId?: string
  sourceUrl?: string
  /** For officials. */
  role?: string
  party?: string
  phone?: string
  email?: string
  website?: string
  /** For policies. */
  status?: string
  body?: string
  billNumber?: string
  /** For services. */
  address?: string
  city?: string
  state?: string
  zipCode?: string
  eligibility?: string
  fees?: string
  hours?: string
  /** For opportunities. */
  startDate?: string | null
  endDate?: string | null
  isVirtual?: string | null
  registrationUrl?: string | null
  spotsAvailable?: number | null
  /** For situations. */
  urgency?: string | null
  slug?: string | null
  /** For learning paths. */
  difficulty?: string | null
  moduleCount?: number | null
  estimatedMinutes?: number | null
  themeId?: string | null
  /** Shared -- pathway color used for accent treatments. */
  pathwayColor?: string
  focusAreas?: Array<{ id: string; name: string }>
  /** Related entities from the knowledge mesh. */
  relatedOfficials?: Array<{ id: string; name: string; role?: string }>
  relatedPolicies?: Array<{ id: string; name: string; status?: string }>
  relatedResources?: Array<{ id: string; title: string; center?: string }>
  relatedServices?: Array<{ id: string; name: string; orgName?: string }>
}

/** Props accepted by {@link WayfinderPanel}. */
export interface WayfinderPanelProps {
  /** The entity to display, or `null` when the panel is closed. */
  panel: PanelData | null
  /** Callback invoked when the user dismisses the panel. */
  onClose: () => void
  /** Navigate to a related item within the panel (drill-through). */
  onNavigate?: (type: string, id: string) => void
}

// ── Constants ────────────────────────────────────────────────────────

/** Human-readable labels for entity types, used in the header badge. */
const TYPE_LABELS: Record<PanelData['type'], string> = {
  resource: 'Resource',
  official: 'Official',
  policy: 'Policy',
  service: 'Service',
  opportunity: 'Opportunity',
  situation: 'Resource Guide',
  path: 'Learning Path',
}

/** Detail page path prefixes, keyed by entity type. */
const DETAIL_PATHS: Record<PanelData['type'], string | null> = {
  resource: '/content/',
  official: '/officials/',
  policy: '/policies/',
  service: '/services/',
  opportunity: null,
  situation: '/help/',
  path: '/learn/',
}

/** Default accent color when no pathway color is provided. */
const DEFAULT_ACCENT = '#319795'

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Derive an inline style for a focus-area pill using the pathway color
 * at 10% opacity for the background.
 *
 * @param color - Hex pathway color (e.g. `'#e53e3e'`).
 * @returns React CSSProperties with `backgroundColor` and `color`.
 */
function pillStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: color + '1a', // hex + 10% alpha
    color: color,
  }
}

/**
 * Format a policy status string into a compact badge color class.
 *
 * @param status - Raw status value from the database.
 * @returns Tailwind color classes for the status badge.
 */
function statusBadgeClasses(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-600'
  const lower = status.toLowerCase()
  if (lower.includes('enacted') || lower.includes('signed') || lower.includes('passed')) {
    return 'bg-green-100 text-green-700'
  }
  if (lower.includes('introduced') || lower.includes('pending') || lower.includes('committee')) {
    return 'bg-yellow-100 text-yellow-700'
  }
  if (lower.includes('vetoed') || lower.includes('failed') || lower.includes('dead')) {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-gray-100 text-gray-600'
}

// ── Sub-components ───────────────────────────────────────────────────

/**
 * Collapsible section within the panel that groups related entities.
 *
 * @param props.title - Section heading text (uppercase).
 * @param props.accentColor - Small circle indicator color.
 * @param props.children - Mini-card content.
 */
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

/**
 * Compact clickable card for a related entity within a {@link PanelSection}.
 *
 * @param props.onClick - Fires when the user clicks the card body.
 * @param props.children - Card content (name, subtitle, etc.).
 */
function MiniCard({
  onClick,
  children,
}: {
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-brand-border rounded-md px-3 py-2.5 hover:shadow transition-shadow cursor-pointer group"
    >
      {children}
      <span className="block text-xs text-[#319795] font-medium mt-1 group-hover:underline">
        View details &rsaquo;
      </span>
    </button>
  )
}

// ── Main Component ───────────────────────────────────────────────────

/**
 * Slide-out detail panel for the Community Exchange wayfinder.
 *
 * Renders a fixed right-edge overlay panel with full entity details and
 * knowledge-mesh connections. Supports drill-through navigation via
 * `onNavigate` so users can explore related items without leaving the panel.
 *
 * @param props - See {@link WayfinderPanelProps}.
 * @returns The panel dialog element, or `null` when closed.
 */
export function WayfinderPanel({ panel, onClose, onNavigate }: WayfinderPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = panel !== null

  // ── Body scroll lock + auto-focus ──

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

  // ── Keyboard handling: Escape dismissal + focus trap ──

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

  // ── Derived values ──

  const accent = panel?.pathwayColor ?? DEFAULT_ACCENT

  /** Navigate to a related entity via the parent callback. */
  function handleNavigate(type: string, id: string) {
    if (onNavigate) {
      onNavigate(type, id)
    }
  }

  // ── Render ──

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
          'fixed right-0 top-0 h-full w-[460px] max-w-full bg-white shadow-2xl z-50 ' +
          'flex flex-col outline-none transition-transform duration-300 ease-in-out ' +
          (isOpen ? 'translate-x-0' : 'translate-x-full')
        }
      >
        {panel && (
          <>
            {/* ── Header bar ── */}
            <div className="flex-shrink-0 sticky top-0 bg-white border-b border-brand-border px-5 py-4 flex items-center gap-3 z-10">
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors"
              >
                <X size={16} />
              </button>
              <span
                className="text-xs font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                style={pillStyle(accent)}
              >
                {TYPE_LABELS[panel.type]}
              </span>
              <h2 className="text-base font-semibold text-brand-text leading-snug line-clamp-2 min-w-0">
                {panel.title}
              </h2>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* ── Main content ── */}
              <div className="space-y-3">
                {/* Summary */}
                {panel.summary && (
                  <p className="text-sm leading-relaxed text-brand-muted">
                    {panel.summary}
                  </p>
                )}

                {/* Description */}
                {panel.description && (
                  <p className="text-sm leading-relaxed text-brand-text">
                    {panel.description}
                  </p>
                )}

                {/* Resource: center + org + source URL */}
                {panel.type === 'resource' && (
                  <div className="space-y-2">
                    {panel.center && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">Center:</span> {panel.center}
                      </p>
                    )}
                    {panel.orgName && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">Organization:</span>{' '}
                        {panel.orgId ? (
                          <Link
                            href={'/organizations/' + panel.orgId}
                            className="text-[#319795] hover:underline"
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
                        className="inline-flex items-center gap-1 text-sm text-[#319795] hover:underline"
                      >
                        <ExternalLink size={14} />
                        View source
                      </a>
                    )}
                  </div>
                )}

                {/* Official: contact info */}
                {panel.type === 'official' && (
                  <div className="space-y-1.5">
                    {panel.role && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">Role:</span> {panel.role}
                      </p>
                    )}
                    {panel.party && (
                      <p className="text-sm text-brand-muted">
                        <span className="font-semibold">Party:</span> {panel.party}
                      </p>
                    )}
                    {panel.phone && (
                      <a
                        href={'tel:' + panel.phone}
                        className="flex items-center gap-1.5 text-sm text-brand-text hover:text-[#319795] transition-colors"
                      >
                        <Phone size={14} className="text-brand-muted" />
                        {panel.phone}
                      </a>
                    )}
                    {panel.email && (
                      <a
                        href={'mailto:' + panel.email}
                        className="flex items-center gap-1.5 text-sm text-brand-text hover:text-[#319795] transition-colors"
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
                        className="flex items-center gap-1.5 text-sm text-[#319795] hover:underline"
                      >
                        <Globe size={14} />
                        Website
                      </a>
                    )}
                  </div>
                )}

                {/* Policy: status + bill number + body */}
                {panel.type === 'policy' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {panel.status && (
                        <span
                          className={
                            'text-xs font-semibold px-2 py-0.5 rounded-full ' +
                            statusBadgeClasses(panel.status)
                          }
                        >
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

                {/* Service: address, hours, eligibility, fees */}
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
                          <span className="font-semibold">Eligibility:</span> {panel.eligibility}
                        </span>
                      </div>
                    )}
                    {panel.fees && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <DollarSign size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>
                          <span className="font-semibold">Fees:</span> {panel.fees}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Opportunity: dates, location, registration, spots */}
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
                            ? 'Virtual'
                            : [panel.address, panel.city].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {panel.spotsAvailable != null && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <Users size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>{panel.spotsAvailable} spots available</span>
                      </div>
                    )}
                    {panel.registrationUrl && (
                      <a
                        href={panel.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#319795] hover:underline mt-1"
                      >
                        <ExternalLink size={14} />
                        Register
                      </a>
                    )}
                  </div>
                )}

                {/* Situation: urgency */}
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

                {/* Learning Path: difficulty, modules, duration */}
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
                        <span>{panel.moduleCount} modules</span>
                      </div>
                    )}
                    {panel.estimatedMinutes != null && (
                      <div className="flex items-start gap-1.5 text-sm text-brand-text">
                        <Clock size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                        <span>{panel.estimatedMinutes} min estimated</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Focus areas ── */}
              {panel.focusAreas && panel.focusAreas.length > 0 && (
                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-brand-muted mb-2">
                    Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {panel.focusAreas.map(function (fa) {
                      return (
                        <span
                          key={fa.id}
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={pillStyle(accent)}
                        >
                          {fa.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Related Officials ── */}
              {panel.relatedOfficials && panel.relatedOfficials.length > 0 && (
                <PanelSection title="Related Officials" accentColor={accent}>
                  {panel.relatedOfficials.map(function (official) {
                    return (
                      <MiniCard
                        key={official.id}
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

              {/* ── Related Policies ── */}
              {panel.relatedPolicies && panel.relatedPolicies.length > 0 && (
                <PanelSection title="Related Policies" accentColor={accent}>
                  {panel.relatedPolicies.map(function (policy) {
                    return (
                      <MiniCard
                        key={policy.id}
                        onClick={function () { handleNavigate('policy', policy.id) }}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-brand-text leading-snug min-w-0 flex-1">
                            {policy.name}
                          </p>
                          {policy.status && (
                            <span
                              className={
                                'text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ' +
                                statusBadgeClasses(policy.status)
                              }
                            >
                              {policy.status}
                            </span>
                          )}
                        </div>
                      </MiniCard>
                    )
                  })}
                </PanelSection>
              )}

              {/* ── Related Resources ── */}
              {panel.relatedResources && panel.relatedResources.length > 0 && (
                <PanelSection title="Related Resources" accentColor={accent}>
                  {panel.relatedResources.map(function (resource) {
                    return (
                      <MiniCard
                        key={resource.id}
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

              {/* ── Related Services ── */}
              {panel.relatedServices && panel.relatedServices.length > 0 && (
                <PanelSection title="Related Services" accentColor={accent}>
                  {panel.relatedServices.map(function (service) {
                    return (
                      <MiniCard
                        key={service.id}
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

            {/* ── Footer action ── */}
            {(function () {
              const detailPath = DETAIL_PATHS[panel.type]
              // Situation uses slug, not id
              const detailHref = panel.type === 'situation'
                ? (detailPath + (panel.slug || ''))
                : detailPath
                  ? (detailPath + panel.id)
                  : null
              // Opportunity with registration URL shows Register button
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
                      Register
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
                    View Full Profile
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
