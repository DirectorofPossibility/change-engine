import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import type { LibraryNugget as LibraryNuggetType } from '@/lib/data/library'

interface LibraryNuggetProps {
  nuggets: LibraryNuggetType[]
  variant: 'sidebar' | 'inline' | 'section'
  color?: string
  /** i18n-translated labels */
  labels?: {
    fromThe?: string
    readMore?: string
    goDeeper?: string
    understanding?: string
  }
}

function NuggetCard({ nugget, color = '#8B7E74', readMoreLabel = 'Read more' }: {
  nugget: LibraryNuggetType
  color?: string
  readMoreLabel?: string
}) {
  return (
    <Link
      href={nugget.link}
      className="group block bg-white rounded-xl border-2 border-brand-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="flex">
        <div
          className="w-1 group-hover:w-1.5 transition-all duration-200 flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="p-4 flex-1 min-w-0">
          <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen size={12} />
            {nugget.documentTitle}
          </p>
          <p className="text-sm text-brand-text leading-relaxed font-serif italic line-clamp-3">
            &ldquo;{nugget.chunkExcerpt}&rdquo;
          </p>
          <div className="flex items-center justify-between mt-2">
            {nugget.pageRef && (
              <span className="text-[10px] text-brand-muted">{nugget.pageRef}</span>
            )}
            <span
              className="text-xs font-semibold transition-colors"
              style={{ color }}
            >
              {readMoreLabel} &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function LibraryNugget({ nuggets, variant, color = '#8B7E74', labels = {} }: LibraryNuggetProps) {
  if (nuggets.length === 0) return null

  const {
    fromThe = 'From the library',
    readMore = 'Read more',
    goDeeper = 'Go deeper',
    understanding = 'Understanding this resource',
  } = labels

  if (variant === 'sidebar') {
    return (
      <aside className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color }} />
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted">{fromThe}</h4>
        </div>
        {nuggets.map(nugget => (
          <NuggetCard key={nugget.documentId} nugget={nugget} color={color} readMoreLabel={readMore} />
        ))}
      </aside>
    )
  }

  if (variant === 'inline') {
    const nugget = nuggets[0]
    return (
      <div className="my-6">
        <Link
          href={nugget.link}
          className="group block bg-brand-bg/60 rounded-xl p-5 hover:bg-brand-bg transition-colors"
        >
          <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen size={12} style={{ color }} />
            {fromThe}
          </p>
          <p className="text-sm text-brand-text leading-relaxed font-serif italic">
            &ldquo;{nugget.chunkExcerpt}&rdquo;
          </p>
          <p className="text-xs text-brand-muted mt-2">
            {nugget.documentTitle}
            {nugget.pageRef && <span className="ml-2">{nugget.pageRef}</span>}
            <span className="ml-2 font-semibold" style={{ color }}>{readMore} &rarr;</span>
          </p>
        </Link>
      </div>
    )
  }

  // variant === 'section'
  const heading = variant === 'section' ? goDeeper : understanding

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="font-serif text-lg font-bold text-brand-text">{heading}</h3>
      </div>
      <div className="h-0.5 w-12 rounded-full mb-4" style={{ backgroundColor: color }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nuggets.map(nugget => (
          <NuggetCard key={nugget.documentId} nugget={nugget} color={color} readMoreLabel={readMore} />
        ))}
      </div>
    </section>
  )
}
