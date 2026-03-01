import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getGuides } from '@/lib/data/exchange'
import { ThemePill } from '@/components/ui/ThemePill'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Guides — The Change Engine',
  description: 'Civic engagement guides for Houston — contacting officials, voting, community organizing, and local resources.',
}

const LEVEL_COLORS: Record<string, string> = {
  'On the Couch': 'bg-green-100 text-green-800',
  'Off the Couch': 'bg-blue-100 text-blue-800',
  'Use Your Superpower': 'bg-purple-100 text-purple-800',
}

export default async function GuidesPage() {
  const guides = await getGuides()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Guides</h1>
      <p className="text-brand-muted mb-8">
        Step-by-step guides for civic engagement, voting, community organizing, and connecting with resources.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map(function (guide) {
          return (
            <Link
              key={guide.guide_id}
              href={'/guides/' + guide.slug}
              className="bg-white rounded-xl border border-brand-border hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {guide.hero_image_url && (
                <div className="relative w-full h-40">
                  <Image
                    src={guide.hero_image_url}
                    alt={guide.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <h2 className="font-semibold text-brand-text mb-1">{guide.title}</h2>
                {guide.description && (
                  <p className="text-sm text-brand-muted mb-3 line-clamp-3">{guide.description}</p>
                )}
                <div className="mt-auto flex items-center gap-2 flex-wrap">
                  {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" />}
                  {guide.engagement_level && (
                    <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')}>
                      {guide.engagement_level}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {guides.length === 0 && (
        <p className="text-center text-brand-muted py-12">Guides coming soon.</p>
      )}
    </div>
  )
}
