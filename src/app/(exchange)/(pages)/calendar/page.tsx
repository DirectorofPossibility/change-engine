import type { Metadata } from 'next'
import Link from 'next/link'
import { getCalendarItems } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { Calendar, MapPin, ExternalLink, Video, Landmark, Heart } from 'lucide-react'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const metadata: Metadata = {
  title: 'Community Calendar | The Change Engine',
  description: 'Upcoming events, civic meetings, volunteer opportunities, and community gatherings in Houston.',
}

export const revalidate = 3600

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; icon: typeof Calendar }> = {
  event: { label: 'Community', bg: 'bg-green-50', text: 'text-green-700', icon: Calendar },
  civic: { label: 'Civic', bg: 'bg-blue-50', text: 'text-blue-700', icon: Landmark },
  opportunity: { label: 'Opportunity', bg: 'bg-purple-50', text: 'text-purple-700', icon: Heart },
  content: { label: 'Featured', bg: 'bg-orange-50', text: 'text-orange-700', icon: Calendar },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function groupByDate(items: Awaited<ReturnType<typeof getCalendarItems>>) {
  const groups: Record<string, typeof items> = {}
  for (const item of items) {
    const key = item.date ? new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ pathway?: string }>
}) {
  const { pathway } = await searchParams
  const items = await getCalendarItems(pathway)
  const grouped = groupByDate(items)
  const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string }][]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Calendar' }]} />

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-brand-text mb-2">Community Calendar</h1>
        <p className="text-brand-muted">Events, civic meetings, and opportunities to get involved.</p>
      </div>

      {/* Pathway filter */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link
          href="/calendar"
          className={'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ' +
            (!pathway ? 'bg-brand-text text-white border-brand-text' : 'bg-white text-brand-muted border-brand-border hover:border-brand-text')}
        >
          All
        </Link>
        {themeEntries.map(function ([id, theme]) {
          const active = pathway === id
          return (
            <Link
              key={id}
              href={'/calendar?pathway=' + id}
              className={'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ' +
                (active ? 'text-white border-transparent' : 'bg-white text-brand-muted border-brand-border hover:border-brand-text')}
              style={active ? { backgroundColor: theme.color } : undefined}
            >
              {theme.name}
            </Link>
          )
        })}
      </div>

      {/* Calendar groups */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={40} className="mx-auto text-brand-muted mb-4" />
          <p className="text-brand-muted">No upcoming events found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(function ([dateLabel, dateItems]) {
            return (
              <div key={dateLabel}>
                <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-3 border-b border-brand-border pb-2">
                  {dateLabel}
                </h2>
                <div className="space-y-3">
                  {dateItems.map(function (item) {
                    const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.event
                    const Icon = style.icon
                    const dt = formatDate(item.date)
                    const pathwayTheme = item.pathway ? (THEMES as Record<string, { color: string }>)[item.pathway] : null

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 bg-white rounded-xl border border-brand-border p-4 hover:shadow-sm transition-shadow"
                      >
                        {/* Date block */}
                        {dt && (
                          <div className="flex-shrink-0 w-14 text-center">
                            <div className="text-[10px] font-bold text-brand-muted tracking-wider">{dt.month}</div>
                            <div className="text-2xl font-bold text-brand-text leading-tight">{dt.day}</div>
                            <div className="text-[10px] text-brand-muted">{dt.weekday}</div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ' + style.bg + ' ' + style.text}>
                              <Icon size={10} /> {item.eventType || style.label}
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
                            <p className="text-xs text-brand-muted line-clamp-2 mb-2">{item.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} /> {item.location}
                              </span>
                            )}
                            {dt && (
                              <span>{dt.time}</span>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex-shrink-0 flex flex-col justify-center">
                          {item.registrationUrl ? (
                            <a
                              href={item.registrationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-brand-accent hover:underline flex items-center gap-1"
                            >
                              Register <ExternalLink size={11} />
                            </a>
                          ) : item.sourceUrl ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-brand-accent hover:underline flex items-center gap-1"
                            >
                              Details <ExternalLink size={11} />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
