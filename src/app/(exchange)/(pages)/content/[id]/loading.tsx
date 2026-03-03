export default function ContentLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-white/60 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-white/60 rounded-full animate-pulse" />
          </div>
          <div className="h-8 w-3/4 bg-white/60 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/60 rounded animate-pulse" />
          <div className="space-y-2 mt-6">
            <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
            <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-white/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-white/60 rounded-xl animate-pulse" />
          <div className="h-24 bg-white/60 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
