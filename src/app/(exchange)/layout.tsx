/**
 * @fileoverview Root layout for all public-facing "(exchange)" routes.
 *
 * Wraps every public page with:
 *  - LanguageProvider  (reads `lang` cookie to set i18n context)
 *  - NeighborhoodProvider (reads `zip` cookie for geo-personalization)
 *  - Schema.org JSON-LD (Organization + WebSite with SearchAction)
 *  - ElectionBanner (top bar, when election is upcoming)
 *  - Skip-to-content accessibility link
 *
 * The two-column wayfinder layout (sidebar + main) is handled by the
 * Wayfinder client component on the homepage. Sub-pages (detail views)
 * render with a Header + Footer wrapper for SEO and direct linking.
 *
 * @datasource Cookies: `lang`, `zip`
 * @caching Dynamic (reads cookies per request)
 * @route layout for /(exchange)/*
 */

import { cookies } from 'next/headers'
import { ElectionBanner } from '@/components/exchange/ElectionBanner'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { NeighborhoodProvider } from '@/lib/contexts/NeighborhoodContext'
import { LeftNav } from '@/components/exchange/LeftNav'
import { Footer } from '@/components/exchange/Footer'
import MobileBottomNav from '@/components/exchange/MobileBottomNav'
import { ChanceChatWidget } from '@/components/exchange/ChanceChatWidget'
import { TranslateWidget } from '@/components/exchange/TranslateWidget'
import { getNextElection } from '@/lib/data/exchange'

export default async function ExchangeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  const zip = cookieStore.get('zip')?.value
  const nextElection = await getNextElection()

  // ── Schema.org JSON-LD ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Community Exchange',
        url: 'https://www.changeengine.us',
        description: 'A civic platform connecting Houston residents with resources, services, and civic participation opportunities.',
      },
      {
        '@type': 'WebSite',
        name: 'Community Exchange',
        url: 'https://www.changeengine.us',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.changeengine.us/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <LanguageProvider initialLang={lang}>
      <NeighborhoodProvider initialZip={zip}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-screen bg-brand-bg">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-accent focus:text-white focus:rounded-lg focus:text-sm">
            Skip to main content
          </a>
          <ElectionBanner election={nextElection} />
          <div id="main-content" className="flex">
            <LeftNav />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex-1 pb-16 lg:pb-0 relative">
                <div className="absolute top-3 right-4 z-30">
                  <TranslateWidget />
                </div>
                {children}
              </div>
              <Footer />
            </div>
          </div>
          <MobileBottomNav />
          <ChanceChatWidget />
        </div>
      </NeighborhoodProvider>
    </LanguageProvider>
  )
}
