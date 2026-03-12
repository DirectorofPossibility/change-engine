'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface ArticleItem {
  id: string
  title: string
  summary: string
  page_count: number
}

interface CenterSection {
  centerName: string
  centerQuestion: string
  articles: ArticleItem[]
  totalCount: number
  themeSlug: string
}

interface CategoryArticleListProps {
  sections: CenterSection[]
}

export function CategoryArticleList({ sections }: CategoryArticleListProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-10">
      {sections.map(function (section) {
        return (
          <section key={section.centerName}>
            <div className="mb-4">
              <h2 className="font-display text-xl font-bold text-brand-text">
                {section.centerName}
              </h2>
              <p className="text-sm text-brand-muted italic">{section.centerQuestion}</p>
            </div>

            <div className="space-y-3">
              {section.articles.map(function (article) {
                return (
                  <Link
                    key={article.id}
                    href={'/library/doc/' + article.id}
                    className="group block bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
                  >
                    <h3 className="font-display text-base font-bold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-brand-muted mt-1 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-2">
                      <FileText size={12} />
                      <span>{article.page_count} {t('library.pages')}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {section.totalCount > section.articles.length && (
              <Link
                href={'/library/category/' + section.themeSlug + '?center=' + section.centerName}
                className="inline-block mt-3 text-sm font-semibold text-brand-accent hover:underline"
              >
                {t('library.see_all_count').replace('{count}', String(section.totalCount))}
              </Link>
            )}
          </section>
        )
      })}
    </div>
  )
}
