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
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { getPipelineStats } from '@/lib/data/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ── Auth guard ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  // ── Sidebar data ──
  const stats = await getPipelineStats()

  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar pipelineStats={stats} />
      <main className="ml-60 min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
