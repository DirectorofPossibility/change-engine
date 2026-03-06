import { cookies } from 'next/headers'
import Link from 'next/link'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { NeighborhoodProvider } from '@/lib/contexts/NeighborhoodContext'
import { THEMES, BRAND } from '@/lib/constants'
import { getNextElection } from '@/lib/data/exchange'
import { Design2Nav } from './components/Design2Nav'
import { Design2Footer } from './components/Design2Footer'

export default async function Design2Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  const zip = cookieStore.get('zip')?.value
  const nextElection = await getNextElection()

  return (
    <LanguageProvider initialLang={lang}>
      <NeighborhoodProvider initialZip={zip}>
        <div className="min-h-screen" style={{ background: '#F0EAE0', fontFamily: "'DM Sans', sans-serif" }}>
          <Design2Nav election={nextElection} />
          <main id="main-content">
            {children}
          </main>
          <Design2Footer />
        </div>
      </NeighborhoodProvider>
    </LanguageProvider>
  )
}
