import type { Metadata } from 'next'
import { getCalendarItems } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { CalendarClient } from './CalendarClient'

export const metadata: Metadata = {
  title: 'Community Calendar | Community Exchange',
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Calendar' }]} />

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-brand-text mb-2">Community Calendar</h1>
        <p className="text-brand-muted">Events, civic meetings, and opportunities to get involved in Houston.</p>
      </div>

      <CalendarClient
        items={items}
        themes={themes}
        initialPathway={pathway}
      />
    </div>
  )
}
