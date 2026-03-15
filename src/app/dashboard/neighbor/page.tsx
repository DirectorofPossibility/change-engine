/**
 * @fileoverview Neighbor portal overview page.
 *
 * Welcoming dashboard for community neighbors with quick actions
 * to submit content, explore the library, and update preferences.
 *
 * @route GET /dashboard/neighbor
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText, BookOpen, SlidersHorizontal, BookMarked, HelpCircle } from 'lucide-react'

export default async function NeighborOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/neighbor')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, display_name')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'neighbor') {
    redirect('/dashboard')
  }

  const displayName = (profile as any)?.display_name || user.email?.split('@')[0] || 'Neighbor'

  // Count user's submissions
  const { count: submissionCount } = await supabase
    .from('content_inbox' as any)
    .select('id', { count: 'exact', head: true })
    .eq('submitted_by', user.id)

  // Get recent published content for the community feed
  const { data: recentContent } = await supabase
    .from('content_published')
    .select('id, title, content_type, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: '#1a1714' }}>
          Welcome, {displayName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#5c6474' }}>
          Your community dashboard — explore, contribute, and stay connected.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/submit"
          className="bg-white border p-6 hover:shadow-md transition-shadow group"
          style={{ borderColor: '#E8E4DF' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(199,91,42,0.1)' }}>
              <FileText size={20} style={{ color: '#C75B2A' }} />
            </div>
            <div>
              <p className="font-semibold group-hover:text-[#C75B2A] transition-colors" style={{ color: '#1a1714' }}>
                Submit Content
              </p>
              <p className="text-sm" style={{ color: '#5c6474' }}>
                Share a resource, event, or story with the community
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/library"
          className="bg-white border p-6 hover:shadow-md transition-shadow group"
          style={{ borderColor: '#E8E4DF' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(26,107,86,0.1)' }}>
              <BookOpen size={20} style={{ color: '#1a6b56' }} />
            </div>
            <div>
              <p className="font-semibold group-hover:text-[#1a6b56] transition-colors" style={{ color: '#1a1714' }}>
                Knowledge Base
              </p>
              <p className="text-sm" style={{ color: '#5c6474' }}>
                Browse guides, reports, and community resources
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/preferences"
          className="bg-white border p-6 hover:shadow-md transition-shadow group"
          style={{ borderColor: '#E8E4DF' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(27,94,138,0.1)' }}>
              <SlidersHorizontal size={20} style={{ color: '#1b5e8a' }} />
            </div>
            <div>
              <p className="font-semibold group-hover:text-[#1b5e8a] transition-colors" style={{ color: '#1a1714' }}>
                Content Preferences
              </p>
              <p className="text-sm" style={{ color: '#5c6474' }}>
                Choose topics and pathways that matter to you
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/tools-guides"
          className="bg-white border p-6 hover:shadow-md transition-shadow group"
          style={{ borderColor: '#E8E4DF' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(74,40,112,0.1)' }}>
              <BookMarked size={20} style={{ color: '#4a2870' }} />
            </div>
            <div>
              <p className="font-semibold group-hover:text-[#4a2870] transition-colors" style={{ color: '#1a1714' }}>
                Tools & Guides
              </p>
              <p className="text-sm" style={{ color: '#5c6474' }}>
                Learn how to get the most out of this platform
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Your Activity */}
      <div className="bg-white border p-6" style={{ borderColor: '#E8E4DF' }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: '#9B9590' }}>
          Your Activity
        </h2>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-3xl font-bold" style={{ color: '#C75B2A' }}>{submissionCount || 0}</p>
            <p className="text-sm" style={{ color: '#5c6474' }}>Submissions</p>
          </div>
        </div>
      </div>

      {/* Recent Community Content */}
      {recentContent && recentContent.length > 0 && (
        <div className="bg-white border p-6" style={{ borderColor: '#E8E4DF' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: '#9B9590' }}>
            Fresh from the Community
          </h2>
          <div className="space-y-3">
            {recentContent.map(function (item: any) {
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="flex items-center justify-between py-2 hover:bg-gray-50 -mx-2 px-2 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1a1714' }}>
                      {item.title}
                    </p>
                    {item.content_type && (
                      <span className="text-xs" style={{ color: '#9B9590' }}>
                        {item.content_type}
                      </span>
                    )}
                  </div>
                  <span className="text-xs flex-shrink-0 ml-4" style={{ color: '#9B9590' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                  </span>
                </Link>
              )
            })}
          </div>
          <Link
            href="/"
            className="inline-block mt-4 text-sm font-medium hover:underline"
            style={{ color: '#C75B2A' }}
          >
            Explore more on the site →
          </Link>
        </div>
      )}

      {/* Help */}
      <div className="p-4" style={{ background: '#FAF8F5', border: '1px solid #E8E4DF' }}>
        <div className="flex items-center gap-3">
          <HelpCircle size={16} style={{ color: '#9B9590' }} />
          <p className="text-xs" style={{ color: '#5c6474' }}>
            Need help?{' '}
            <Link href="/dashboard/manual" className="underline hover:no-underline" style={{ color: '#C75B2A' }}>
              Read the user manual
            </Link>{' '}
            or explore the{' '}
            <Link href="/dashboard/tools-guides" className="underline hover:no-underline" style={{ color: '#C75B2A' }}>
              tools & guides
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
