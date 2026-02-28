import { cookies } from 'next/headers'
import { Header } from '@/components/exchange/Header'
import { Footer } from '@/components/exchange/Footer'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { NeighborhoodProvider } from '@/lib/contexts/NeighborhoodContext'

export default async function ExchangeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  const zip = cookieStore.get('zip')?.value

  return (
    <LanguageProvider initialLang={lang}>
      <NeighborhoodProvider initialZip={zip}>
        <div className="min-h-screen bg-brand-bg flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </NeighborhoodProvider>
    </LanguageProvider>
  )
}
