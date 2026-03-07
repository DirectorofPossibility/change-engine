import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { SenatorToolClient } from './SenatorToolClient'

export const metadata: Metadata = {
  title: 'Call Your Senators — Community Exchange',
  description: 'Congress is voting on issues that affect your daily life. Find your senators, get a script, and make your voice heard in 2 minutes.',
}

export default function CallYourSenatorsPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Elections', href: '/compass' }, { label: 'Call Your Senators' }]} />
      <SenatorToolClient />
    </div>
  )
}
