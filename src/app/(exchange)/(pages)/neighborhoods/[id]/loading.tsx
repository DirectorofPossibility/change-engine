export default function NeighborhoodLoading() {
  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-4 w-40 bg-white/60 rounded animate-pulse mb-6" />
      <div className="h-10 w-1/2 bg-white/60 rounded animate-pulse mb-4" />
      <div className="h-64 bg-white/60 animate-pulse mb-6" />
      <div className="space-y-2 mb-8">
        <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-white/60 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-white/60 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
