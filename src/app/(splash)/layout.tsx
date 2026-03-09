import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'Change Engine — Coming Soon',
  description: 'A civic platform connecting Houston neighbors with resources, services, and civic participation opportunities. Coming soon.',
}

export default async function SplashLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value

  return (
    <LanguageProvider initialLang={lang}>
      {children}
    </LanguageProvider>
  )
}
