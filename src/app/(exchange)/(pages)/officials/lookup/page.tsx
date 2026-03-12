import type { Metadata } from 'next'
import { ZipLookupForm } from '@/components/exchange/ZipLookupForm'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Who Represents You?',
  description: 'Drop your ZIP code to see who represents you in Houston and Harris County.',
}

export default function ZipLookupPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Who Runs This', href: '/officials' }, { label: 'Find Your Reps' }]} />
      <h1 className="text-3xl font-bold text-brand-text mb-2">Who Represents You?</h1>
      <p className="text-brand-muted mb-8 max-w-2xl">
        Drop your ZIP code. We\u2019ll show you everyone — federal, state, county, and city.
      </p>
      <ZipLookupForm />
    </div>
  )
}
