/**
 * @fileoverview Layout for the admin dashboard route group.
 *
 * Acts as an authentication guard: redirects unauthenticated users to
 * `/login?redirect=/dashboard`.  Renders a fixed sidebar with pipeline
 * stats and a main content area for child pages.
 *
 * @datasource Supabase Auth (session check); pipeline stats for sidebar
 * @caching Dynamic (auth check per request)
 * @route layout for /dashboard/*
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { getPipelineStats } from '@/lib/data/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ── Auth guard ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  // ── Fetch user role & org ──
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id, display_name')
    .eq('auth_id', user.id)
    .single()

  const role = profile?.role || 'user'
  const displayName = (profile as any)?.display_name || user.email?.split('@')[0] || 'User'

  // Restrict dashboard to admins, partners, and neighbors
  if (role !== 'admin' && role !== 'partner' && role !== 'neighbor') {
    redirect('/me')
  }

  let orgName: string | null = null
  if (role === 'partner' && profile?.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('org_name')
      .eq('org_id', profile.org_id)
      .single()
    orgName = org?.org_name || null
  }

  // ── Sidebar data ──
  const stats = await getPipelineStats()

  // Count pending role requests (admin only)
  let pendingRequestCount = 0
  if (role === 'admin') {
    const { count } = await supabase
      .from('role_requests' as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    pendingRequestCount = count || 0
  }

  // Read language preference from cookie
  const cookieStore = await cookies()
  const initialLang = cookieStore.get('lang')?.value

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      <LanguageProvider initialLang={initialLang}>
        <DashboardShell
          pipelineStats={stats}
          role={role}
          orgName={orgName}
          pendingRequestCount={pendingRequestCount}
          displayName={displayName}
          reviewCount={stats.needsReview}
        >
          {children}
        </DashboardShell>
      </LanguageProvider>
    </div>
  )
}
