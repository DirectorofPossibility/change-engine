import type { Metadata } from 'next'
import { getCalendarItems } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { CalendarClient } from './CalendarClient'

export const metadata: Metadata = {
  title: 'Community Calendar — Change Engine',
  description: 'Upcoming events, civic meetings, volunteer opportunities, and community gatherings in Houston.',
}

export const revalidate = 3600

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ pathway?: string }>
}) {
  const { pathway } = await searchParams
  const items = await getCalendarItems()

  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color }
  })

  return (
    <div>
      <IndexPageHero
        color="#6a4e10"
        pattern="tripod"
        title="Community Calendar"
        subtitle="Events, civic meetings, and opportunities to get involved"
        intro="From volunteer days to town halls — see what's happening in Houston and show up for your community."
        stats={items.length > 0 ? [
          { value: items.length, label: 'Events' },
        ] : undefined}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Calendar' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <CalendarClient
              items={items}
              themes={themes}
              initialPathway={pathway}
            />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="calendar"
                color="#6a4e10"
                related={[
                  { label: 'Opportunities', href: '/opportunities', color: '#7a2018' },
                  { label: 'Organizations', href: '/organizations', color: '#1e4d7a' },
                  { label: 'News', href: '/news', color: '#1a5030' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
