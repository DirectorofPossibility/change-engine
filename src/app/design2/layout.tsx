import { cookies } from 'next/headers'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { NeighborhoodProvider } from '@/lib/contexts/NeighborhoodContext'
import { getNextElection } from '@/lib/data/exchange'
import { Design2Nav } from './components/Design2Nav'
import { Design2Footer } from './components/Design2Footer'
import { ChanceChatWidget } from '@/components/exchange/ChanceChatWidget'
import './design2.css'

export default async function Design2Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  const zip = cookieStore.get('zip')?.value
  const nextElection = await getNextElection()

  return (
    <LanguageProvider initialLang={lang}>
      <NeighborhoodProvider initialZip={zip}>
        <div className="d2-root min-h-screen">
          <Design2Nav election={nextElection} />
          <main id="main-content">
            {children}
          </main>
          <Design2Footer />
          <ChanceChatWidget />
        </div>
      </NeighborhoodProvider>
    </LanguageProvider>
  )
}
