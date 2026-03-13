'use client'

import { resetSpiral } from '@/lib/spiral'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function RedoOnboarding() {
  const router = useRouter()

  function handleRedo() {
    resetSpiral()
    router.push('/exchange')
  }

  return (
    <button
      onClick={handleRedo}
      className="flex items-center gap-2 px-4 py-2.5 border border-rule font-mono text-micro uppercase tracking-wider text-muted hover:border-ink hover:text-ink transition-colors"
    >
      <RefreshCw size={14} />
      Redo Getting Started Guide
    </button>
  )
}
