export default function Loading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div style={{ background: '#F5F0E8', minHeight: 420 }}>
        <div style={{ height: 3, background: '#C4663A' }} />
        <div className="max-w-[1000px] mx-auto px-6 py-16 md:py-24">
          <div className="h-3 w-40 animate-pulse" style={{ background: 'rgba(196,102,58,0.15)' }} />
          <div className="h-3 w-32 mt-8 animate-pulse" style={{ background: 'rgba(196,102,58,0.15)' }} />
          <div className="h-12 w-80 mt-4 animate-pulse" style={{ background: 'rgba(196,102,58,0.12)' }} />
          <div className="h-5 w-64 mt-4 animate-pulse" style={{ background: 'rgba(196,102,58,0.1)' }} />
          <div className="h-16 w-96 mt-6 animate-pulse" style={{ background: 'rgba(196,102,58,0.08)' }} />
          <div className="mt-8" style={{ width: 60, height: 2, background: 'rgba(196,102,58,0.2)' }} />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="space-y-10">
          {[0, 1, 2].map(function (i) {
            return (
              <div key={i}>
                <div className="h-3 w-40 mb-4 animate-pulse" style={{ background: 'rgba(196,102,58,0.12)' }} />
                <div className="flex gap-4 overflow-hidden">
                  {[0, 1, 2, 3].map(function (j) {
                    return <div key={j} className="flex-shrink-0 w-[280px] h-52 animate-pulse" style={{ background: '#F5F0E8' }} />
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
