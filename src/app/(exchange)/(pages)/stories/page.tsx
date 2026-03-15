import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Stories — Change Engine',
  description: 'Stories of impact and resilience from Houston community members.',
}


export default async function StoriesPage() {
  const supabase = await createClient()
  const { data: stories } = await supabase
    .from('success_stories')
    .select('*')
    .order('created_at', { ascending: false })

  const items = stories || []
  const visible = items.slice(0, 4)
  const rest = items.slice(4)

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            Community Stories
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Real stories of impact, resilience, and connection from Houston neighbors. Every journey matters.
          </p>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontSize: '2rem',  }}>{items.length}</span>
                <span style={{ fontSize: '0.875rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Stories</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.875rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Stories</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: '1.5rem',  }}>All Stories</h2>
          <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{items.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1.5rem' }} />

        {items.length === 0 && (
          <div className="text-center py-16" style={{ border: '1px dashed ' + '#dde1e8' }}>
            <p style={{ fontSize: '1.1rem', color: "#5c6474" }}>No stories yet. Check back soon.</p>
          </div>
        )}

        <div className="space-y-4">
          {visible.map(function (s: any) {
            return (
              <Link
                key={s.story_id || s.id}
                href={'/stories/' + (s.story_id || s.id)}
                className="block group py-4 hover:opacity-80"
                style={{ borderBottom: '1px solid #dde1e8' }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }} className="group-hover:underline">
                  {s.title || s.story_title}
                </h3>
                {(s.summary || s.story_summary) && (
                  <p style={{ color: "#5c6474", fontSize: '0.875rem' }} className="mt-1 line-clamp-3">{s.summary || s.story_summary}</p>
                )}
                {s.person_name && (
                  <p style={{ color: "#1b5e8a", fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {s.person_name}{s.neighborhood ? ' from ' + s.neighborhood : ''}
                  </p>
                )}
              </Link>
            )
          })}
        </div>

        {rest.length > 0 && (
          <details className="mt-4">
            <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
              See {rest.length} more stor{rest.length !== 1 ? 'ies' : 'y'}
            </summary>
            <div className="space-y-4 mt-4">
              {rest.map(function (s: any) {
                return (
                  <Link
                    key={s.story_id || s.id}
                    href={'/stories/' + (s.story_id || s.id)}
                    className="block group py-4 hover:opacity-80"
                    style={{ borderBottom: '1px solid #dde1e8' }}
                  >
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }} className="group-hover:underline">
                      {s.title || s.story_title}
                    </h3>
                    {(s.summary || s.story_summary) && (
                      <p style={{ color: "#5c6474", fontSize: '0.875rem' }} className="mt-1 line-clamp-3">{s.summary || s.story_summary}</p>
                    )}
                    {s.person_name && (
                      <p style={{ color: "#1b5e8a", fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500 }}>
                        {s.person_name}{s.neighborhood ? ' from ' + s.neighborhood : ''}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </details>
        )}
      </div>

      {/* Footer rule + link */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
