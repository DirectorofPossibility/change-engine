'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { DashboardHeader } from './DashboardHeader'
import { DashboardBreadcrumb } from './DashboardBreadcrumb'
import type { PipelineStats } from '@/lib/types/dashboard'

interface DashboardShellProps {
  children: React.ReactNode
  pipelineStats: PipelineStats
  role: string
  orgName: string | null
  pendingRequestCount: number
  displayName: string
  reviewCount: number
}

export function DashboardShell({
  children,
  pipelineStats,
  role,
  orgName,
  pendingRequestCount,
  displayName,
  reviewCount,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={function () { setSidebarOpen(false) }}
        />
      )}

      <Sidebar
        pipelineStats={pipelineStats}
        role={role}
        orgName={orgName}
        pendingRequestCount={pendingRequestCount}
        mobileOpen={sidebarOpen}
        onMobileClose={function () { setSidebarOpen(false) }}
      />

      <div className="md:ml-60 min-h-screen flex flex-col">
        <DashboardHeader
          displayName={displayName}
          role={role}
          orgName={orgName}
          reviewCount={reviewCount}
          onMenuToggle={function () { setSidebarOpen(!sidebarOpen) }}
        />
        <DashboardBreadcrumb />
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </>
  )
}
