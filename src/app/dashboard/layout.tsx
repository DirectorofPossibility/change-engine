// TODO: Sprint 5 — add auth middleware
import { Sidebar } from '@/components/layout/Sidebar'
import { getPipelineStats } from '@/lib/data/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
