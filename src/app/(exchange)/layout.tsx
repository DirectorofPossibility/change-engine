import { cookies } from 'next/headers'
import { Header } from '@/components/exchange/Header'
import { Footer } from '@/components/exchange/Footer'
import { ElectionBanner } from '@/components/exchange/ElectionBanner'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { NeighborhoodProvider } from '@/lib/contexts/NeighborhoodContext'

export default async function ExchangeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  const zip = cookieStore.get('zip')?.value

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'The Change Engine',
        url: 'https://www.changeengine.us',
        description: 'A civic platform connecting Houston residents with resources, services, and civic participation opportunities.',
      },
      {
        '@type': 'WebSite',
        name: 'The Change Engine',
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
        <div className="min-h-screen bg-brand-bg flex flex-col">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-accent focus:text-white focus:rounded-lg focus:text-sm">
            Skip to main content
          </a>
          <ElectionBanner />
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </NeighborhoodProvider>
    </LanguageProvider>
  )
}
