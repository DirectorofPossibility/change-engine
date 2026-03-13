'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
            <div className="mb-4" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}>
              <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }}>
                {section.centerName}
              </h2>
              <p className="text-sm italic" style={{ fontFamily: SERIF, color: MUTED }}>{section.centerQuestion}</p>
            </div>

            <div className="space-y-3">
              {section.articles.map(function (article) {
                return (
                  <Link
                    key={article.id}
                    href={'/library/doc/' + article.id}
                    className="group block"
                    style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}
                  >
                    <h3 style={{ fontFamily: SERIF, color: INK }} className="text-base group-hover:underline line-clamp-1">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ fontFamily: SERIF, color: MUTED }}>
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs mt-2" style={{ fontFamily: MONO, color: MUTED }}>
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
                style={{ fontFamily: MONO, color: CLAY }}
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
