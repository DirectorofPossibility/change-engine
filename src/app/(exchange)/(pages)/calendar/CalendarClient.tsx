'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar, ChevronLeft, ChevronRight, MapPin, ExternalLink,
  Video, Landmark, Heart, Clock, X, Navigation, CalendarPlus,
  Building2, Repeat,
} from 'lucide-react'

// ── Types ──

interface CalendarItem {
  id: string
  title: string
  description: string | null
  category: 'event' | 'civic' | 'opportunity' | 'content'
  date: string | null
  endDate: string | null
  location: string | null
  isVirtual: boolean
  registrationUrl: string | null
  sourceUrl: string | null
  imageUrl: string | null
  pathway: string | null
  eventType: string | null
  orgName: string | null
  orgId: string | null
  detailHref: string | null
  isFree: boolean
  isRecurring: boolean
  recurrencePattern: string | null
}

interface ThemeInfo {
  id: string
  name: string
  color: string
}

interface CalendarClientProps {
  items: CalendarItem[]
  themes: ThemeInfo[]
  initialPathway?: string
}

// ── Category styling ──

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgClass: string; textClass: string; icon: typeof Calendar }> = {
  event:       { label: 'Community',   color: '#7a2018', bgClass: 'bg-green-50',  textClass: 'text-green-700',  icon: Calendar },
  civic:       { label: 'Civic',       color: '#6a4e10', bgClass: 'bg-blue-50',   textClass: 'text-blue-700',   icon: Landmark },
  opportunity: { label: 'Opportunity', color: '#1b5e8a', bgClass: 'bg-purple-50', textClass: 'text-purple-700', icon: Heart },
  content:     { label: 'Featured',    color: '#1e4d7a', bgClass: 'bg-orange-50', textClass: 'text-orange-700', icon: Calendar },
}

type ViewMode = 'month' | 'week' | '3day' | 'day'

// ── Helpers ──

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const days: Date[] = []
  // Fill from Sunday before
  for (let i = -startDay; i < 42 - startDay; i++) {
    days.push(new Date(year, month, 1 + i))
  }
  return days
}

function getWeekStart(d: Date): Date {
  const day = d.getDay()
  return addDays(d, -day)
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Main Component ──

export function CalendarClient({ items, themes, initialPathway }: CalendarClientProps) {
  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()))
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['event', 'civic', 'opportunity', 'content']))
  const [activePathway, setActivePathway] = useState<string | null>(initialPathway || null)
  const [activeEventType, setActiveEventType] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null)

  // Filter items
  // Unique event types for filter chips
  const eventTypes = useMemo(function () {
    const types = new Map<string, number>()
    for (const item of items) {
      const t = item.eventType || CATEGORY_CONFIG[item.category]?.label || 'Other'
      types.set(t, (types.get(t) || 0) + 1)
    }
    return Array.from(types.entries()).sort(function (a, b) { return b[1] - a[1] })
  }, [items])

  const filtered = useMemo(function () {
    return items.filter(function (item) {
      if (!activeCategories.has(item.category)) return false
      if (activePathway && item.pathway !== activePathway) return false
      if (activeEventType) {
        const t = item.eventType || CATEGORY_CONFIG[item.category]?.label || 'Other'
        if (t !== activeEventType) return false
      }
      return true
    })
  }, [items, activeCategories, activePathway, activeEventType])

  // Map items to dates for quick lookup
  const dateMap = useMemo(function () {
    const map: Record<string, CalendarItem[]> = {}
    for (const item of filtered) {
      if (!item.date) continue
      const key = startOfDay(new Date(item.date)).toISOString()
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [filtered])

  function getItemsForDate(d: Date): CalendarItem[] {
    return dateMap[startOfDay(d).toISOString()] || []
  }

  // Navigation
  function navigatePrev() {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7))
    else if (view === '3day') setCurrentDate(addDays(currentDate, -3))
    else setCurrentDate(addDays(currentDate, -1))
  }

  function navigateNext() {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7))
    else if (view === '3day') setCurrentDate(addDays(currentDate, 3))
    else setCurrentDate(addDays(currentDate, 1))
  }

  function goToToday() {
    setCurrentDate(startOfDay(new Date()))
  }

  function toggleCategory(cat: string) {
    setActiveCategories(function (prev) {
      const next = new Set(prev)
      if (next.has(cat)) { next.delete(cat) } else { next.add(cat) }
      return next
    })
  }

  // Get visible days based on view
  const visibleDays = useMemo(function (): Date[] {
    if (view === 'month') return getMonthDays(currentDate.getFullYear(), currentDate.getMonth())
    if (view === 'week') {
      const ws = getWeekStart(currentDate)
      return Array.from({ length: 7 }, function (_, i) { return addDays(ws, i) })
    }
    if (view === '3day') {
      return Array.from({ length: 3 }, function (_, i) { return addDays(currentDate, i) })
    }
    return [currentDate]
  }, [view, currentDate])

  const today = startOfDay(new Date())

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Nav */}
        <div className="flex items-center gap-2">
          <button onClick={navigatePrev} className="p-1.5 hover:bg-brand-bg transition-colors" aria-label="Previous">
            <ChevronLeft size={18} className="text-brand-muted" />
          </button>
          <button onClick={goToToday} className="px-3 py-1 text-xs font-medium text-brand-accent hover:bg-brand-accent/5 transition-colors">
            Today
          </button>
          <button onClick={navigateNext} className="p-1.5 hover:bg-brand-bg transition-colors" aria-label="Next">
            <ChevronRight size={18} className="text-brand-muted" />
          </button>
          <h2 className="text-lg font-display font-bold text-brand-text ml-2">
            {view === 'month' && formatMonthYear(currentDate)}
            {view === 'week' && formatDayHeader(getWeekStart(currentDate)) + ' - ' + formatDayHeader(addDays(getWeekStart(currentDate), 6))}
            {view === '3day' && formatDayHeader(currentDate) + ' - ' + formatDayHeader(addDays(currentDate, 2))}
            {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-brand-bg p-1 sm:ml-auto">
          {(['day', '3day', 'week', 'month'] as ViewMode[]).map(function (v) {
            const labels: Record<ViewMode, string> = { day: 'Day', '3day': '3 Day', week: 'Week', month: 'Month' }
            return (
              <button
                key={v}
                onClick={function () { setView(v) }}
                className={'px-3 py-1.5 rounded-md text-xs font-medium transition-colors ' +
                  (view === v ? 'bg-white shadow-sm text-brand-text' : 'text-brand-muted hover:text-brand-text')}
              >
                {labels[v]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(CATEGORY_CONFIG).map(function ([key, cfg]) {
          const Icon = cfg.icon
          const active = activeCategories.has(key)
          const count = items.filter(function (i) { return i.category === key }).length
          return (
            <button
              key={key}
              onClick={function () { toggleCategory(key) }}
              className={'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ' +
                (active ? cfg.bgClass + ' ' + cfg.textClass + ' border-transparent' : 'bg-white text-brand-muted border-brand-border opacity-50')}
            >
              <Icon size={12} />
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Event type filter */}
      {eventTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted self-center mr-1">Type</span>
          <button
            onClick={function () { setActiveEventType(null) }}
            className={'px-2.5 py-1 text-[11px] font-medium transition-colors border ' +
              (!activeEventType ? 'bg-brand-text text-white border-brand-text' : 'bg-white text-brand-muted border-brand-border hover:border-brand-text')}
          >
            All
          </button>
          {eventTypes.map(function ([type, count]) {
            const active = activeEventType === type
            return (
              <button
                key={type}
                onClick={function () { setActiveEventType(active ? null : type) }}
                className={'px-2.5 py-1 text-[11px] font-medium transition-colors border ' +
                  (active ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-brand-muted border-brand-border hover:border-brand-text')}
              >
                {type} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Pathway filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={function () { setActivePathway(null) }}
          className={'px-3 py-1.5 text-xs font-medium transition-colors border ' +
            (!activePathway ? 'bg-brand-text text-white border-brand-text' : 'bg-white text-brand-muted border-brand-border hover:border-brand-text')}
        >
          All Pathways
        </button>
        {themes.map(function (theme) {
          const active = activePathway === theme.id
          return (
            <button
              key={theme.id}
              onClick={function () { setActivePathway(active ? null : theme.id) }}
              className="px-3 py-1.5 text-xs font-medium transition-colors border"
              style={active
                ? { backgroundColor: theme.color, color: 'white', borderColor: theme.color }
                : { borderColor: theme.color, color: theme.color }}
            >
              {theme.name}
            </button>
          )
        })}
      </div>

      {/* Count */}
      <p className="text-xs text-brand-muted mb-4">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>

      {/* ── Month View ── */}
      {view === 'month' && (
        <div className="bg-white border border-brand-border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-brand-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d) {
              return (
                <div key={d} className="text-center text-[10px] font-semibold text-brand-muted py-2 uppercase tracking-wide">
                  {d}
                </div>
              )
            })}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {visibleDays.map(function (day, i) {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = isSameDay(day, today)
              const dayItems = getItemsForDate(day)
              return (
                <div
                  key={i}
                  className={'min-h-[90px] border-b border-r border-brand-border/50 p-1 ' +
                    (isCurrentMonth ? 'bg-white' : 'bg-brand-bg/50') +
                    (i % 7 === 0 ? ' border-l-0' : '')}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={'text-xs font-medium px-1 rounded ' +
                      (isToday ? 'bg-brand-accent text-white' : isCurrentMonth ? 'text-brand-text' : 'text-brand-muted/50')}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map(function (item) {
                      const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.event
                      return (
                        <button
                          key={item.id}
                          onClick={function () { setSelectedEvent(item) }}
                          className="w-full text-left px-1 py-0.5 rounded text-[10px] leading-tight truncate transition-colors hover:opacity-80"
                          style={{ backgroundColor: cfg.color + '18', color: cfg.color }}
                        >
                          {item.title}
                        </button>
                      )
                    })}
                    {dayItems.length > 3 && (
                      <button
                        onClick={function () { setCurrentDate(day); setView('day') }}
                        className="text-[10px] text-brand-accent hover:underline px-1"
                      >
                        +{dayItems.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Week / 3-Day View ── */}
      {(view === 'week' || view === '3day') && (
        <div className="bg-white border border-brand-border overflow-hidden">
          <div className={'grid ' + (view === 'week' ? 'grid-cols-7' : 'grid-cols-3')}>
            {visibleDays.map(function (day, i) {
              const isToday = isSameDay(day, today)
              const dayItems = getItemsForDate(day)
              return (
                <div key={i} className={'border-r border-brand-border/50 last:border-r-0 ' + (isToday ? 'bg-brand-accent/5' : '')}>
                  {/* Day header */}
                  <div className={'text-center py-2 border-b border-brand-border/50 ' + (isToday ? 'bg-brand-accent/10' : 'bg-brand-bg/50')}>
                    <div className="text-[10px] text-brand-muted uppercase">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={'text-lg font-bold ' + (isToday ? 'text-brand-accent' : 'text-brand-text')}>
                      {day.getDate()}
                    </div>
                  </div>
                  {/* Events */}
                  <div className="p-1.5 space-y-1 min-h-[200px]">
                    {dayItems.length === 0 && (
                      <p className="text-[10px] text-brand-muted/40 text-center pt-8">No events</p>
                    )}
                    {dayItems.map(function (item) {
                      const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.event
                      const Icon = cfg.icon
                      return (
                        <button
                          key={item.id}
                          onClick={function () { setSelectedEvent(item) }}
                          className="w-full text-left p-2 border transition-colors hover:border-ink"
                          style={{ borderColor: cfg.color + '40', backgroundColor: cfg.color + '08' }}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Icon size={10} style={{ color: cfg.color }} />
                            <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                          <p className="text-xs font-medium text-brand-text line-clamp-2">{item.title}</p>
                          {item.date && (
                            <p className="text-[10px] text-brand-muted mt-0.5">
                              <Clock size={9} className="inline mr-0.5" />
                              {formatTime(item.date)}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Day View ── */}
      {view === 'day' && (
        <div className="bg-white border border-brand-border overflow-hidden">
          <div className={'text-center py-3 border-b border-brand-border ' + (isSameDay(currentDate, today) ? 'bg-brand-accent/10' : 'bg-brand-bg/50')}>
            <div className="text-sm text-brand-muted">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className={'text-3xl font-bold ' + (isSameDay(currentDate, today) ? 'text-brand-accent' : 'text-brand-text')}>
              {currentDate.getDate()}
            </div>
            <div className="text-xs text-brand-muted">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {getItemsForDate(currentDate).length === 0 ? (
              <p className="text-center text-brand-muted py-12 text-sm">No events on this day.</p>
            ) : (
              getItemsForDate(currentDate).map(function (item) {
                return renderEventCard(item, themes, function () { setSelectedEvent(item) })
              })
            )}
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={function () { setSelectedEvent(null) }}>
          <div className="bg-white max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={function (e) { e.stopPropagation() }}>
            <EventDetail event={selectedEvent} themes={themes} onClose={function () { setSelectedEvent(null) }} />
          </div>
        </div>
      )}

      {/* ── Upcoming List (below calendar for context) ── */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-brand-muted mb-3 uppercase tracking-wide">Upcoming Events</h3>
        <div className="space-y-2">
          {filtered
            .filter(function (item) {
              if (!item.date) return false
              return new Date(item.date) >= today
            })
            .slice(0, 8)
            .map(function (item) {
              return renderEventCard(item, themes, function () { setSelectedEvent(item) })
            })}
          {filtered.filter(function (item) { return item.date && new Date(item.date) >= today }).length === 0 && (
            <p className="text-sm text-brand-muted text-center py-8">No upcoming events match your filters.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Event Card (shared) ──

function renderEventCard(item: CalendarItem, themes: ThemeInfo[], onClick: () => void) {
  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.event
  const Icon = cfg.icon
  const pathwayTheme = item.pathway ? themes.find(function (t) { return t.id === item.pathway }) : null

  const dt = item.date ? new Date(item.date) : null
  const dateInfo = dt ? {
    month: dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: dt.getDate(),
    weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }),
    time: formatTime(item.date!),
  } : null

  return (
    <div
      key={item.id}
      className="flex gap-4 bg-white border border-brand-border p-4 hover:border-ink transition-colors cursor-pointer"
      onClick={onClick}
    >
      {dateInfo && (
        <div className="flex-shrink-0 w-14 text-center">
          <div className="text-[10px] font-bold text-brand-muted tracking-wider">{dateInfo.month}</div>
          <div className="text-2xl font-bold text-brand-text leading-tight">{dateInfo.day}</div>
          <div className="text-[10px] text-brand-muted">{dateInfo.weekday}</div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ' + cfg.bgClass + ' ' + cfg.textClass}>
            <Icon size={10} /> {item.eventType || cfg.label}
          </span>
          {item.isVirtual && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
              <Video size={10} /> Virtual
            </span>
          )}
          {pathwayTheme && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pathwayTheme.color }} />
          )}
        </div>
        <h3 className="text-sm font-semibold text-brand-text mb-1 line-clamp-2">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-brand-muted line-clamp-2 mb-1">{item.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
          {item.location && (
            <span className="flex items-center gap-1"><MapPin size={11} /> {item.location}</span>
          )}
          {dateInfo && dateInfo.time && <span>{dateInfo.time}</span>}
          {item.orgName && (
            <span className="flex items-center gap-1"><Building2 size={11} /> {item.orgName}</span>
          )}
          {item.isRecurring && (
            <span className="flex items-center gap-1 text-brand-accent"><Repeat size={11} /> Recurring</span>
          )}
          {item.isFree && (
            <span className="font-medium text-theme-money">Free</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 flex flex-col justify-center">
        {item.registrationUrl ? (
          <a
            href={item.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-accent hover:underline flex items-center gap-1"
            onClick={function (e) { e.stopPropagation() }}
          >
            Register <ExternalLink size={11} />
          </a>
        ) : item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-accent hover:underline flex items-center gap-1"
            onClick={function (e) { e.stopPropagation() }}
          >
            Details <ExternalLink size={11} />
          </a>
        ) : null}
      </div>
    </div>
  )
}

// ── Helpers for calendar/map URLs ──

function buildGoogleCalUrl(event: CalendarItem): string {
  if (!event.date) return ''
  const start = new Date(event.date)
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 3600000)
  const fmt = function (d: Date) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') }
  const loc = event.isVirtual ? 'Virtual' : event.location || ''
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(event.title) + '&dates=' + fmt(start) + '/' + fmt(end) + '&details=' + encodeURIComponent(event.description || '') + '&location=' + encodeURIComponent(loc)
}

function buildMapUrl(location: string): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location)
}

// ── Event Detail Modal Content ──

function EventDetail({ event, themes, onClose }: { event: CalendarItem; themes: ThemeInfo[]; onClose: () => void }) {
  const cfg = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.event
  const Icon = cfg.icon
  const pathwayTheme = event.pathway ? themes.find(function (t) { return t.id === event.pathway }) : null
  const dt = event.date ? new Date(event.date) : null
  const endDt = event.endDate ? new Date(event.endDate) : null
  const calUrl = buildGoogleCalUrl(event)
  const mapUrl = event.location && !event.isVirtual ? buildMapUrl(event.location) : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-brand-border">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ' + cfg.bgClass + ' ' + cfg.textClass}>
              <Icon size={12} /> {event.eventType || cfg.label}
            </span>
            {event.isVirtual && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                <Video size={12} /> Virtual
              </span>
            )}
            {event.isFree && (
              <span className="text-xs font-medium text-theme-money">Free</span>
            )}
            {event.isRecurring && (
              <span className="inline-flex items-center gap-1 text-xs text-brand-accent">
                <Repeat size={12} /> Recurring
              </span>
            )}
            {pathwayTheme && (
              <span className="text-xs font-medium" style={{ color: pathwayTheme.color }}>
                {pathwayTheme.name}
              </span>
            )}
          </div>
          <h2 className="text-xl font-display font-bold text-brand-text">{event.title}</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-brand-bg" aria-label="Close">
          <X size={18} className="text-brand-muted" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Date & Time */}
        {dt && (
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-brand-muted flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-brand-text">
                {dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-brand-muted">
                {formatTime(event.date!)}
                {endDt ? ' - ' + formatTime(event.endDate!) : ''}
              </p>
              {event.isRecurring && event.recurrencePattern && (
                <p className="text-xs text-brand-accent mt-0.5">{event.recurrencePattern}</p>
              )}
            </div>
          </div>
        )}

        {/* Location with map link */}
        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-brand-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-brand-text">{event.location}</p>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent hover:underline flex items-center gap-1 mt-0.5">
                  <Navigation size={10} /> Open in Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {/* Organization */}
        {event.orgName && (
          <div className="flex items-center gap-3">
            <Building2 size={16} className="text-brand-muted flex-shrink-0" />
            {event.orgId ? (
              <Link href={'/organizations/' + event.orgId} className="text-sm text-brand-accent hover:underline" onClick={function (e) { e.stopPropagation() }}>
                {event.orgName}
              </Link>
            ) : (
              <p className="text-sm text-brand-text">{event.orgName}</p>
            )}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="bg-brand-bg p-4">
            <p className="text-sm text-brand-text leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-colors"
            >
              Register
            </a>
          )}
          {event.detailHref && (
            <Link
              href={event.detailHref}
              className="flex-1 text-center py-2.5 border border-brand-border text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
              onClick={function (e) { e.stopPropagation() }}
            >
              Full Details
            </Link>
          )}
          {event.sourceUrl && !event.detailHref && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 border border-brand-border text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
            >
              View Source
            </a>
          )}
        </div>

        {/* Add to calendar */}
        {calUrl && (
          <div className="flex items-center gap-2 pt-1">
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-muted hover:text-brand-accent flex items-center gap-1 transition-colors"
            >
              <CalendarPlus size={12} /> Add to Google Calendar
            </a>
            <span className="text-brand-border">|</span>
            <a
              href="/api/calendar.ics"
              className="text-xs text-brand-muted hover:text-brand-accent flex items-center gap-1 transition-colors"
            >
              <CalendarPlus size={12} /> Subscribe (.ics)
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
