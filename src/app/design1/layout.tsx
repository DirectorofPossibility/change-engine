import { cookies } from 'next/headers'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'

export default async function Design1Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value

  return (
    <LanguageProvider initialLang={lang}>
      {children}
    </LanguageProvider>
  )
}
