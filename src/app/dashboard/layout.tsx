import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { getPipelineStats } from '@/lib/data/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  var supabase = await createClient()
  var { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  var stats = await getPipelineStats()

  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar pipelineStats={stats} />
      <main className="ml-60 min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
