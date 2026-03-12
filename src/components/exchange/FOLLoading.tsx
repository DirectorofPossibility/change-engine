'use client'

import { FOLSpinner } from './GradientFOL'

interface FOLLoadingProps {
  message?: string
  size?: number
}

export function FOLLoading({ message = 'Loading...', size = 48 }: FOLLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <FOLSpinner size={size} />
      <p className="text-sm text-brand-muted font-body italic">{message}</p>
    </div>
  )
}
