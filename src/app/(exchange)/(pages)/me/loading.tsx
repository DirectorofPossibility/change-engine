export default function MeLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white/60 h-32 animate-pulse mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-40 bg-white/60 rounded animate-pulse" />
          <div className="h-24 bg-white/60 animate-pulse" />
          <div className="h-24 bg-white/60 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-white/60 rounded animate-pulse" />
          <div className="h-48 bg-white/60 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
