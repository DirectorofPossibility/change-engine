import { Header } from '@/components/exchange/Header'
import { Footer } from '@/components/exchange/Footer'

export default function ExchangeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
