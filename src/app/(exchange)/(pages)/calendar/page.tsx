import type { Metadata } from 'next'
import { getCalendarItems } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'
import { CalendarClient } from './CalendarClient'
import { requirePageEnabled } from '@/lib/data/page-gate'

export const metadata: Metadata = {
  title: 'Community Calendar — Change Engine',
  description: 'Upcoming events, civic meetings, volunteer opportunities, and community gatherings in your community.',
}

export const revalidate = 3600


export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ pathway?: string }>
}) {
  await requirePageEnabled('page_calendar')
  const { pathway } = await searchParams
  const items = await getCalendarItems()

  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color }
  })

  return (
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Community Calendar"
        subtitle="From volunteer days to town halls -- see what is happening in your community and show up."
        color="#6a4e10"
        stats={items.length > 0 ? [{ value: items.length, label: 'Events' }] : undefined}
      />
      <Breadcrumb items={[{ label: 'Calendar' }]} />

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <CalendarClient
          items={items}
          themes={themes}
          initialPathway={pathway}
        />

        <PageCrossLinks preset="community" />
      </div>
    </div>
  )
}
