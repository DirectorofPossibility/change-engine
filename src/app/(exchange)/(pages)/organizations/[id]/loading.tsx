export default function Loading() {
  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white/60 animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-56 bg-white/60 rounded animate-pulse" />
              <div className="h-4 w-32 bg-white/60 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 mt-6">
            <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
            <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-white/60 rounded animate-pulse" />
          </div>
          <div className="space-y-3 mt-8">
            <div className="h-5 w-32 bg-white/60 rounded animate-pulse" />
            <div className="h-20 w-full bg-white/60 animate-pulse" />
            <div className="h-20 w-full bg-white/60 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-white/60 animate-pulse" />
          <div className="h-24 bg-white/60 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
