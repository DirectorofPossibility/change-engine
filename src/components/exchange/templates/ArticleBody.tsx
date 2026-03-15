/**
 * @fileoverview Article body typography wrapper — Greater Good-style prose.
 *
 * Wraps article/content body text with consistent typography:
 *   - ~17px body text, 1.7 line-height
 *   - Serif headings for section breaks
 *   - Teal/blue links with underline
 *   - Indented blockquotes with left border
 *   - Proper list styling
 *
 * Use this around any long-form content (articles, library docs, guides).
 */

import type { ReactNode } from 'react'

interface ArticleBodyProps {
  children: ReactNode
  className?: string
}

export function ArticleBody({ children, className = '' }: ArticleBodyProps) {
  return (
    <div className={`article-body ${className}`}>
      {children}

      <style jsx>{`
        .article-body {
          font-size: 17px;
          line-height: 1.7;
          color: #2c2c2c;
        }

        .article-body h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #0d1117;
        }

        .article-body h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: #0d1117;
        }

        .article-body p {
          margin-bottom: 1.25rem;
        }

        .article-body a {
          color: #1b5e8a;
          text-decoration: underline;
          text-decoration-color: rgba(27, 94, 138, 0.3);
          text-underline-offset: 2px;
          transition: text-decoration-color 150ms ease;
        }

        .article-body a:hover {
          text-decoration-color: #1b5e8a;
        }

        .article-body blockquote {
          border-left: 3px solid #dde1e8;
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #5c6474;
        }

        .article-body ul,
        .article-body ol {
          margin: 1rem 0 1.25rem 1.5rem;
        }

        .article-body li {
          margin-bottom: 0.4rem;
        }

        .article-body ul li {
          list-style-type: disc;
        }

        .article-body ol li {
          list-style-type: decimal;
        }

        .article-body img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem 0;
        }

        .article-body hr {
          border: none;
          height: 1px;
          background: #dde1e8;
          margin: 2rem 0;
        }

        .article-body strong {
          font-weight: 600;
          color: #0d1117;
        }
      `}</style>
    </div>
  )
}
