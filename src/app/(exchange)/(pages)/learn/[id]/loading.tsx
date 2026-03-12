export default function LearnLoading() {
  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-4 w-48 bg-white/60 rounded animate-pulse mb-6" />
      <div className="h-6 w-32 bg-white/60 rounded-full animate-pulse mb-4" />
      <div className="h-10 w-2/3 bg-white/60 rounded animate-pulse mb-3" />
      <div className="space-y-2 mb-8">
        <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
        <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-white/60 rounded animate-pulse" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 items-start">
            <div className="h-8 w-8 bg-white/60 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/2 bg-white/60 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
