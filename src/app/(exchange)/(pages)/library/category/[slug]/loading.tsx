export default function Loading() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        <div className="h-8 w-1/3 bg-white/60 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-white/60 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[0, 1, 2, 3, 4, 5].map(function (i) {
            return <div key={i} className="h-36 bg-white/60 rounded-xl animate-pulse" />
          })}
        </div>
      </div>
    </div>
  )
}
