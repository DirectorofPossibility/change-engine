export default function Loading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1080px] mx-auto space-y-6">
        {/* Hero skeleton */}
        <div className="h-48 bg-white/60 animate-pulse" />
        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(function (i) {
            return <div key={i} className="h-36 bg-white/60 animate-pulse" />
          })}
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(function (i) {
            return <div key={i} className="h-48 bg-white/60 animate-pulse" />
          })}
        </div>
      </div>
    </div>
  )
}
