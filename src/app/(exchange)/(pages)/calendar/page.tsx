import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getCalendarItems } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
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
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden border-b">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-12 relative">
          <p style={{ color: "#5c6474", fontSize: 11, letterSpacing: '0.12em' }} className="uppercase mb-3">
            The Change Engine
          </p>
          <h1 style={{  }} className="text-3xl sm:text-4xl mb-3">
            Community Calendar
          </h1>
          <p style={{ color: "#5c6474", fontSize: 17 }} className="max-w-[600px] leading-relaxed mb-4">
            From volunteer days to town halls -- see what is happening in Houston and show up for your community.
          </p>
          {items.length > 0 && (
            <div style={{ fontSize: 12, color: "#5c6474" }}>
              <strong style={{  }}>{items.length}</strong> Events
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontSize: 11, color: "#5c6474", letterSpacing: '0.06em' }} className="uppercase">
          <span>Calendar</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <CalendarClient
          items={items}
          themes={themes}
          initialPathway={pathway}
        />

        {/* Footer link */}
        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />
        <div className="text-center pb-12">
          <Link href="/" style={{ color: "#1b5e8a", fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
