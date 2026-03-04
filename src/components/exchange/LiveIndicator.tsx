'use client'

interface LiveIndicatorProps {
  count: number
}

export function LiveIndicator({ count }: LiveIndicatorProps) {
  if (count <= 0) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="hidden sm:inline">LIVE</span>
      <span className="text-green-600/70">&middot;</span>
      <span className="text-green-600/70">{count} stories</span>
    </div>
  )
}
