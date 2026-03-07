import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { SenatorToolClient } from './SenatorToolClient'

export const metadata: Metadata = {
  title: 'Call Your Senators — Community Exchange',
  description: 'Two minutes. One call. Your senators have staff whose only job is to count opinions like yours.',
}

export default function CallYourSenatorsPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Elections', href: '/compass' }, { label: 'Call Your Senators' }]} />
      <SenatorToolClient />
    </div>
  )
}
