export default function CandidateLoading() {
  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-24 w-24 bg-white/60 rounded-full animate-pulse flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-8 w-1/2 bg-white/60 rounded animate-pulse" />
              <div className="h-5 w-1/3 bg-white/60 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-white/60 rounded-full animate-pulse" />
                <div className="h-6 w-24 bg-white/60 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
            <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-white/60 animate-pulse" />
          <div className="h-24 bg-white/60 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
