export default function OfficialsLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-8 w-48 bg-white/60 rounded animate-pulse mb-3" />
      <div className="h-4 w-64 bg-white/60 rounded animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) {
          return <div key={i} className="h-44 bg-white/60 rounded-xl animate-pulse" />
        })}
      </div>
    </div>
  )
}
