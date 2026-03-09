import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Accessibility | Community Exchange',
  description: 'Our commitment to making civic participation accessible to everyone.',
}

export default function AccessibilityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: 'Accessibility' }]} />

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mt-6 mb-2">
        Accessibility
      </h1>
      <p className="text-brand-muted mb-8">
        Our commitment to making civic participation accessible to everyone.
      </p>

      <div className="prose prose-sm max-w-none text-brand-text space-y-6">
        <section>
          <h2 className="font-serif text-xl font-bold text-brand-text mb-2">Our Commitment</h2>
          <p className="leading-relaxed text-brand-text/80">
            The Change Lab believes that civic life should be open to everyone. We are committed to ensuring that the Community Exchange is accessible to people of all abilities, backgrounds, and circumstances. We continuously work to improve the usability and experience of our platform for all visitors.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-brand-text mb-2">What We Do</h2>
          <ul className="list-disc pl-5 space-y-2 text-brand-text/80">
            <li>Write all content at a 6th-grade reading level so information is clear and easy to understand</li>
            <li>Provide translations in Spanish and Vietnamese for key content</li>
            <li>Use semantic HTML and proper heading structure for screen reader compatibility</li>
            <li>Maintain sufficient color contrast throughout the platform</li>
            <li>Support keyboard navigation across all interactive elements</li>
            <li>Design responsive layouts that work across devices and screen sizes</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-brand-text mb-2">Standards</h2>
          <p className="leading-relaxed text-brand-text/80">
            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. We recognize that accessibility is an ongoing effort and we are continually working to improve.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-brand-text mb-2">Feedback</h2>
          <p className="leading-relaxed text-brand-text/80">
            If you experience any difficulty accessing content on the Community Exchange, or have suggestions for how we can improve accessibility, please reach out to us at{' '}
            <a href="mailto:hello@thechangelab.org" className="text-brand-accent hover:underline">
              hello@thechangelab.org
            </a>
            . We take all feedback seriously and will do our best to respond promptly.
          </p>
        </section>
      </div>
    </div>
  )
}
