export default function Loading() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="h-8 bg-brand-bg rounded w-72 mb-2" />
      <div className="h-4 bg-brand-bg rounded w-96 mb-8" />

      <div className="h-32 bg-brand-bg rounded-xl mb-10" />

      <div className="flex gap-3 mb-8">
        <div className="h-12 bg-brand-bg rounded-lg w-64" />
        <div className="h-12 bg-brand-bg rounded-lg w-40" />
      </div>
    </div>
  )
}
