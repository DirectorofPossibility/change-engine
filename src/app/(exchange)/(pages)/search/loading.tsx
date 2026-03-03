export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="h-8 w-48 bg-white/60 rounded animate-pulse mb-3" />
        <div className="h-4 w-64 bg-white/60 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 mb-6">
        {[0, 1, 2, 3, 4].map(function (i) {
          return <div key={i} className="h-8 w-24 bg-white/60 rounded-lg animate-pulse" />
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map(function (i) {
          return <div key={i} className="h-40 bg-white/60 rounded-xl animate-pulse" />
        })}
      </div>
    </div>
  )
}
