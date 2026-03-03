/**
 * @fileoverview Polymorphic feed card for the Community Exchange wayfinder.
 *
 * Renders a compact card whose layout adapts based on the {@link FeedItem.type}:
 *   - **resource** — left color bar in the pathway color, center dot + name,
 *     title, summary, org name, and an "Open" link.
 *   - **official** — teal accent tint, SVG initials circle, "WHO DECIDES"
 *     label, name, role, and an optional relevance note.
 *   - **policy** — status-colored accent (green/amber/red), status badge pill,
 *     "POLICY" label, name, relevance note, and governing body.
 *
 * All cards respond to click events (typically opening a slide-over detail
 * panel in the parent) and feature a subtle hover lift animation.
 */
'use client'

// ── Types ────────────────────────────────────────────────────────────────

/**
 * Unified feed item that can represent a resource, official, policy, or service.
 * Only the fields relevant to a given `type` need to be populated.
 */
export interface FeedItem {
  /** Discriminant — controls which card layout is rendered. */
  type: 'resource' | 'official' | 'policy' | 'service'
  /** Unique identifier for the entity. */
  id: string
  /** Primary display title. */
  title: string
  /** Optional short summary or description. */
  summary?: string
  /** For resources: the engagement center (Learning, Action, etc.). */
  center?: string
  /** For resources/services: parent organization name. */
  orgName?: string
  /** For officials: role or position title. */
  role?: string
  /** For policies: current status (Active, Proposed, Failed). */
  status?: string
  /** For policies: governing body that decides (e.g. "Houston City Council"). */
  body?: string
  /** Contextual note explaining why this item appears in the current feed. */
  relevance?: string
  /** Pathway accent color (hex) used for the left color bar on resource cards. */
  pathwayColor?: string
  /** Link to the entity's detail page. */
  href?: string
}

/**
 * Props accepted by {@link FeedCard}.
 */
interface FeedCardProps {
  /** The feed item to render. */
  item: FeedItem
  /** Callback fired when the card is clicked (e.g. to open a detail panel). */
  onClick?: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Default accent color when no pathway color is provided. */
const DEFAULT_ACCENT = '#8B7E74'

/** Teal accent used for official cards (matches brand teal). */
const TEAL = '#319795'

/**
 * Maps a policy status string to its accent color.
 *
 * @param status - The policy status value.
 * @returns A hex color string: green for active, amber for proposed, red for failed.
 */
function policyAccentColor(status?: string): string {
  if (!status) return DEFAULT_ACCENT
  const s = status.toLowerCase()
  if (s === 'active' || s === 'passed' || s === 'enacted' || s === 'signed') return '#38a169'
  if (s === 'proposed' || s === 'pending' || s === 'introduced' || s === 'in committee') return '#d69e2e'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return '#e53e3e'
  return DEFAULT_ACCENT
}

/**
 * Maps a policy status string to Tailwind background/text utility classes for a pill badge.
 *
 * @param status - The policy status value.
 * @returns A className string for the status badge.
 */
function statusBadgeClasses(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-600'
  const s = status.toLowerCase()
  if (s === 'active' || s === 'passed' || s === 'enacted' || s === 'signed') return 'bg-green-100 text-green-700'
  if (s === 'proposed' || s === 'pending' || s === 'introduced' || s === 'in committee') return 'bg-amber-100 text-amber-700'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

/**
 * Extracts up to two initials from a full name for the avatar circle.
 *
 * @param name - The person's full name.
 * @returns One or two uppercase initial characters.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ── Sub-components ───────────────────────────────────────────────────────

/**
 * Resource card layout — left color bar, center dot, title, summary, org, and link.
 *
 * @param props.item - The resource-type {@link FeedItem}.
 */
function ResourceLayout({ item }: { item: FeedItem }) {
  const accent = item.pathwayColor || DEFAULT_ACCENT

  return (
    <div className="flex-1 min-w-0 py-2.5 pr-3 pl-3">
      {/* Center dot + center name */}
      {item.center && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: accent }}
          />
          <span className="text-[8px] uppercase tracking-wide text-brand-muted font-medium">
            {item.center}
          </span>
        </div>
      )}
      <h4 className="text-[13px] font-semibold text-brand-text leading-snug line-clamp-2">
        {item.title}
      </h4>
      {item.summary && (
        <p className="text-[11.5px] text-brand-muted mt-1 leading-relaxed line-clamp-2">
          {item.summary}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        {item.orgName && (
          <span className="text-[10px] text-brand-muted truncate mr-2">{item.orgName}</span>
        )}
        <span className="text-[11px] font-medium flex-shrink-0" style={{ color: TEAL }}>
          Open &#8250;
        </span>
      </div>
    </div>
  )
}

/**
 * Official card layout — teal tint, SVG initials circle, label, name, and role.
 *
 * @param props.item - The official-type {@link FeedItem}.
 */
function OfficialLayout({ item }: { item: FeedItem }) {
  const initials = getInitials(item.title)

  return (
    <div className="flex-1 min-w-0 py-2.5 pr-3 pl-3 flex items-center gap-3">
      {/* SVG initials circle */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="18" fill={TEAL} opacity={0.15} />
        <circle cx="18" cy="18" r="15" fill={TEAL} opacity={0.25} />
        <text
          x="18"
          y="18"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="12"
          fontWeight="600"
          fill={TEAL}
        >
          {initials}
        </text>
      </svg>
      <div className="min-w-0">
        <span className="text-[8px] uppercase tracking-wide font-semibold block" style={{ color: TEAL }}>
          Who Decides
        </span>
        <h4 className="text-[13px] font-semibold text-brand-text leading-snug line-clamp-1">
          {item.title}
        </h4>
        {item.role && (
          <p className="text-[11.5px] text-brand-muted leading-snug line-clamp-1">{item.role}</p>
        )}
        {item.relevance && (
          <p className="text-[10px] text-brand-muted mt-0.5 italic line-clamp-1">{item.relevance}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Policy card layout — status-colored tint, badge pill, label, name, and governing body.
 *
 * @param props.item - The policy-type {@link FeedItem}.
 */
function PolicyLayout({ item }: { item: FeedItem }) {
  const accent = policyAccentColor(item.status)

  return (
    <div className="flex-1 min-w-0 py-2.5 pr-3 pl-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[8px] uppercase tracking-wide font-semibold" style={{ color: accent }}>
          Policy
        </span>
        {item.status && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium leading-none ${statusBadgeClasses(item.status)}`}>
            {item.status}
          </span>
        )}
      </div>
      <h4 className="text-[13px] font-semibold text-brand-text leading-snug line-clamp-2">
        {item.title}
      </h4>
      {item.relevance && (
        <p className="text-[10px] text-brand-muted mt-1 italic line-clamp-1">{item.relevance}</p>
      )}
      {item.body && (
        <p className="text-[10px] text-brand-muted mt-1">
          Decided by: <span className="font-medium">{item.body}</span>
        </p>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

/**
 * Polymorphic feed card that renders a resource, official, or policy layout
 * based on the {@link FeedItem.type} discriminant.
 *
 * Cards have a white background, rounded corners, a left color bar (3 px
 * border-left), and a subtle lift-on-hover animation. Clicking the card
 * fires the `onClick` callback, which the parent typically uses to open a
 * slide-over detail panel.
 *
 * @param props.item - The feed item data. See {@link FeedItem}.
 * @param props.onClick - Optional click handler.
 *
 * @example
 * ```tsx
 * <FeedCard
 *   item={{ type: 'resource', id: '1', title: 'Food Bank', center: 'Resource', pathwayColor: '#e53e3e' }}
 *   onClick={() => openPanel('1')}
 * />
 * ```
 */
export function FeedCard({ item, onClick }: FeedCardProps) {
  /** Resolve the left bar accent color based on card type. */
  const leftBarColor = (() => {
    switch (item.type) {
      case 'official':
        return TEAL
      case 'policy':
        return policyAccentColor(item.status)
      case 'resource':
      case 'service':
      default:
        return item.pathwayColor || DEFAULT_ACCENT
    }
  })()

  /** Resolve an optional tinted background for official/policy cards. */
  const bgTint = (() => {
    switch (item.type) {
      case 'official':
        return `${TEAL}08` // ~3 % opacity teal tint
      case 'policy':
        return `${policyAccentColor(item.status)}08`
      default:
        return undefined
    }
  })()

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full text-left flex bg-white rounded-lg border border-brand-border
        overflow-hidden cursor-pointer
        hover:-translate-y-[2px] hover:shadow-md
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent
      "
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: leftBarColor,
        backgroundColor: bgTint,
      }}
    >
      {/* Render the type-specific layout */}
      {(item.type === 'resource' || item.type === 'service') && <ResourceLayout item={item} />}
      {item.type === 'official' && <OfficialLayout item={item} />}
      {item.type === 'policy' && <PolicyLayout item={item} />}
    </button>
  )
}
