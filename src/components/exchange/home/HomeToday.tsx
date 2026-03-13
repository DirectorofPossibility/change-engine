import Link from 'next/link'

interface HomeTodayProps {
  quote?: {
    quote_text: string
    attribution?: string
    source_url?: string
  } | null
  promotions?: Array<{
    promo_id: string
    title: string
    subtitle?: string
    description?: string
    cta_text?: string
    cta_href?: string
    color?: string
  }>
  upcomingEvents?: Array<{
    id: string
    title: string
    date: string
    type: string | null
    location: string | null
    href: string
  }>
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDayOfWeek(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
  } catch {
    return ''
  }
}

const todayStr = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export function HomeToday({ quote, promotions, upcomingEvents }: HomeTodayProps) {
  const hasEvents = upcomingEvents && upcomingEvents.length > 0
  const hasPromotions = promotions && promotions.length > 0

  return (
    <section id="today" className="bg-paper">
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.14em] text-blue uppercase mb-1.5">
          Today in Houston
        </p>
        <p className="font-body text-sm text-muted mb-8">
          {todayStr}
        </p>

        {/* Quote of the day */}
        {quote && (
          <div className="mb-12">
            <blockquote>
              <p className="font-body text-[clamp(18px,2.5vw,24px)] italic leading-relaxed mb-3">
                &ldquo;{quote.quote_text}&rdquo;
              </p>
              {quote.attribution && (
                <footer className="font-mono text-micro text-muted tracking-wider">
                  &mdash; {quote.attribution}
                </footer>
              )}
            </blockquote>
          </div>
        )}

        {/* Coming up */}
        {hasEvents && (
          <div className="mb-10">
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase mb-4">
              Coming up
            </p>
            {upcomingEvents!.slice(0, 5).map(function (ev) {
              return (
                <Link
                  key={ev.id}
                  href={ev.href}
                  className="group flex gap-4 py-3 transition-colors border-b border-clay/10"
                >
                  <div className="text-center min-w-[44px] shrink-0">
                    <p className="font-mono text-[10px] text-muted uppercase">
                      {formatDayOfWeek(ev.date)}
                    </p>
                    <p className="font-body text-lg text-blue">
                      {formatDate(ev.date).split(' ')[1]}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-base leading-snug group-hover:text-blue transition-colors">
                      {ev.title}
                    </p>
                    {ev.location && (
                      <p className="font-mono text-[10px] text-muted mt-0.5 tracking-wider">
                        {ev.location}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
            <div className="mt-4">
              <Link href="/events" className="font-body text-[13px] italic text-blue hover:underline">
                Full calendar &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Announcements */}
        {hasPromotions && promotions!.map(function (promo) {
          return (
            <div
              key={promo.promo_id}
              className="mb-4 py-4 border-y border-rule"
            >
              <p className="font-mono text-[10px] tracking-wider uppercase mb-1.5" style={{ color: promo.color || '#1b5e8a' }}>
                Announcement
              </p>
              <p className="font-body text-lg mb-1">
                {promo.title}
              </p>
              {promo.description && (
                <p className="font-body text-sm text-muted leading-relaxed mb-2">
                  {promo.description}
                </p>
              )}
              {promo.cta_href && (
                <Link href={promo.cta_href} className="font-body text-[13px] italic text-blue hover:underline">
                  {promo.cta_text || 'Learn more'} &rarr;
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
