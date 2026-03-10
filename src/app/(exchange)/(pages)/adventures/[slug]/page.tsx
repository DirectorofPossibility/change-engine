import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { AdventureEngine } from '@/components/exchange/AdventureEngine'
import { getAdventure, ALL_ADVENTURES } from '@/lib/data/adventures'

export function generateStaticParams() {
  return ALL_ADVENTURES.map(a => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const adventure = getAdventure(params.slug)
  if (!adventure) return {}
  return {
    title: `${adventure.title} — Community Adventures`,
    description: adventure.description,
  }
}

export default function AdventurePage({ params }: { params: { slug: string } }) {
  const adventure = getAdventure(params.slug)
  if (!adventure) notFound()

  return (
    <div>
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[{ label: 'Adventures', href: '/adventures' }, { label: adventure.title }]} />
        <div className="mt-4">
          <AdventureEngine adventure={adventure} />
        </div>
      </div>
    </div>
  )
}
