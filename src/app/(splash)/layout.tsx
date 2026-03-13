import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'The Change Engine — Houston Civic Guide',
  description: 'Your community guide to Houston civic life. Officials, services, policies, events, and more — all in one place.',
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
