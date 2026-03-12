'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface SiblingDoc {
  id: string
  title: string
}

interface ArticleSidebarProps {
  currentDocId: string
  siblings: SiblingDoc[]
  themeSlug: string
  themeName: string
  themeColor: string
}

export function ArticleSidebar({
  currentDocId,
  siblings,
  themeSlug,
  themeName,
  themeColor,
}: ArticleSidebarProps) {
  const { t } = useTranslation()

  return (
    <nav className="bg-white border border-brand-border p-5 lg:sticky lg:top-24">
      <Link
        href={'/library/category/' + themeSlug}
        className="flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline mb-4"
      >
        <ChevronLeft size={14} />
        {t('library.back_to_category').replace('{name}', themeName)}
      </Link>

      <div
        className="h-0.5 w-8 rounded-full mb-4"
        style={{ backgroundColor: themeColor }}
      />

      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-3">
        {t('library.in_this_section')}
      </h3>

      <ul className="space-y-1.5">
        {siblings.map(function (doc) {
          const isCurrent = doc.id === currentDocId
          return (
            <li key={doc.id}>
              <Link
                href={'/library/doc/' + doc.id}
                className={
                  'block text-sm px-3 py-2 transition-colors line-clamp-2 ' +
                  (isCurrent
                    ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                    : 'text-brand-muted hover:text-brand-text hover:bg-gray-50')
                }
              >
                {doc.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
