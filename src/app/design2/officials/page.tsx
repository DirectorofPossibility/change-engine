import type { Metadata } from 'next'
import Link from 'next/link'
import { getOfficials } from '@/lib/data/exchange'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Officials — Community Exchange',
  description: 'Elected officials serving the Houston community at every level of government.',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function levelColor(level: string): string {
  switch (level) {
    case 'Federal':
      return 'bg-blue-100 text-blue-800'
    case 'State':
      return 'bg-amber-100 text-amber-800'
    case 'County':
      return 'bg-emerald-100 text-emerald-800'
    case 'City':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-stone-100 text-stone-700'
  }
}

function partyColor(party: string | null): string {
  if (!party) return 'bg-stone-100 text-stone-600'
  const p = party.toLowerCase()
  if (p.includes('democrat')) return 'bg-sky-100 text-sky-800'
  if (p.includes('republican')) return 'bg-red-100 text-red-800'
  return 'bg-stone-100 text-stone-600'
}

function initialsCircleColor(level: string): string {
  switch (level) {
    case 'Federal':
      return 'bg-blue-200 text-blue-900'
    case 'State':
      return 'bg-amber-200 text-amber-900'
    case 'County':
      return 'bg-emerald-200 text-emerald-900'
    case 'City':
      return 'bg-purple-200 text-purple-900'
    default:
      return 'bg-stone-200 text-stone-700'
  }
}

export default async function OfficialsPage() {
  const { officials } = await getOfficials()

  const levels = ['All', 'City', 'County', 'State', 'Federal']

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EAE0' }}>
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/design2"
          className="inline-flex items-center text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          &larr; Home
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div
          className="w-16 h-1 rounded-full mb-6"
          style={{ backgroundColor: '#38a169' }}
        />
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-3">
          Elected Officials
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl leading-relaxed">
          The people who represent our community at every level of government.
          Learn who they are, what they stand for, and how to reach them.
        </p>
      </header>

      {/* Filter Chips (static display) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <span
              key={level}
              className={
                'inline-block px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                (level === 'All'
                  ? 'text-white'
                  : 'bg-white/70 text-stone-600 border border-stone-300')
              }
              style={level === 'All' ? { backgroundColor: '#38a169' } : undefined}
            >
              {level}
            </span>
          ))}
        </div>
      </div>

      {/* Officials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {officials.map((official: any) => (
            <Link
              key={official.official_id}
              href={'/officials/' + official.official_id}
              className="group block bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ borderWidth: '1px', borderColor: '#D4CCBE' }}
            >
              <div className="p-5">
                {/* Photo or Initials Circle */}
                <div className="flex justify-center mb-4">
                  {official.photo_url ? (
                    <img
                      src={official.photo_url}
                      alt={official.official_name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-stone-200"
                    />
                  ) : (
                    <div
                      className={
                        'w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold ' +
                        initialsCircleColor(official.level || '')
                      }
                    >
                      {getInitials(official.official_name || '')}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className="font-serif text-lg font-bold text-stone-900 text-center group-hover:text-green-800 transition-colors">
                  {official.official_name}
                </h2>

                {/* Title */}
                {official.title && (
                  <p className="text-sm text-stone-500 text-center mt-1 line-clamp-2">
                    {official.title}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {official.level && (
                    <span
                      className={
                        'inline-block px-2 py-0.5 rounded text-xs font-medium ' +
                        levelColor(official.level)
                      }
                    >
                      {official.level}
                    </span>
                  )}
                  {official.party && (
                    <span
                      className={
                        'inline-block px-2 py-0.5 rounded text-xs font-medium ' +
                        partyColor(official.party)
                      }
                    >
                      {official.party}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {officials.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-500 text-lg">No officials found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
