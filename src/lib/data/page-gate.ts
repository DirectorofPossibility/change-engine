import { redirect } from 'next/navigation'
import { getSiteConfig } from './site-config'

/**
 * Call at the top of a page component to check if it's enabled.
 * If disabled, redirects to /exchange with a flash message.
 *
 * Usage: await requirePageEnabled('page_help')
 */
export async function requirePageEnabled(key: string): Promise<void> {
  const config = await getSiteConfig()
  if (config[key] === false) {
    redirect('/exchange')
  }
}
