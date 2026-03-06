import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { Mail, MapPin, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us — Community Exchange',
  description: 'Get in touch with The Change Lab team.',
}

export default function ContactPage() {
  return (
    <div>
      <PageHero variant="sacred" sacredPattern="seed" gradientColor="#E8723A" title="Contact Us" subtitle="Have a question, suggestion, or want to partner with us? We would love to hear from you." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Contact' }]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-4">The Change Lab</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-muted" /><a href="mailto:hello@thechangelab.org" className="text-brand-accent hover:underline">hello@thechangelab.org</a></div>
              <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">Houston, Texas</span></div>
              <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-brand-muted" /><a href="https://www.changeengine.us" className="text-brand-accent hover:underline">www.changeengine.us</a></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-4">Ways to Connect</h2>
            <ul className="space-y-3 text-sm text-brand-text">
              <li><strong className="text-brand-text">Report an issue</strong> — Something wrong or outdated? Let us know.</li>
              <li><strong className="text-brand-text">Suggest content</strong> — Know a resource we should feature? Share it.</li>
              <li><strong className="text-brand-text">Partner with us</strong> — Organizations and agencies can join the Exchange.</li>
              <li><strong className="text-brand-text">Volunteer</strong> — Help us build a better civic platform for Houston.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
