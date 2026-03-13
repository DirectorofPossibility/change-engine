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
            <div className="mb-4" style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>
                {section.centerName}
              </h2>
              <p className="text-sm italic" style={{ color: "#5c6474" }}>{section.centerQuestion}</p>
            </div>

            <div className="space-y-3">
              {section.articles.map(function (article) {
                return (
                  <Link
                    key={article.id}
                    href={'/library/doc/' + article.id}
                    className="group block"
                    style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem' }}
                  >
                    <h3 style={{  }} className="text-base group-hover:underline line-clamp-1">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ color: "#5c6474" }}>
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs mt-2" style={{ color: "#5c6474" }}>
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
                className="inline-block mt-3 text-sm font-semibold hover:underline"
                style={{ color: "#1b5e8a" }}
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
