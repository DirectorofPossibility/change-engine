/**
 * @fileoverview Privacy Policy page for The Change Lab, The Change Engine,
 * and the Community Exchange.
 *
 * @route GET /privacy
 */
import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for The Change Lab, The Change Engine, and the Community Exchange.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />

      <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-text mt-6 mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-brand-muted mb-8">Effective Date: March 4, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-brand-text">
        <section>
          <p>
            This Privacy Policy describes how <strong>The Change Lab</strong> (operating through its
            fiscal sponsor, <strong>Impact Hub Houston</strong>), its digital platform{' '}
            <strong>The Change Engine</strong> (www.changeengine.us), and the{' '}
            <strong>Community Exchange</strong> (collectively, &ldquo;we,&rdquo; &ldquo;us,&rdquo;
            or &ldquo;our&rdquo;) collect, use, and protect information when you use our websites,
            applications, and services.
          </p>
          <p>
            We are committed to transparency and to safeguarding the information entrusted to us by
            the communities we serve.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">1. Who We Are</h2>
          <p>
            The Change Lab is a nonprofit initiative operating under the fiscal sponsorship of{' '}
            <strong>Impact Hub Houston</strong>, located at 4201 Main St., Suite L055-C, Houston,
            Texas 77002, USA. Community Exchange is our civic discovery platform at changeengine.us,
            connecting Houston residents with resources, services, and civic participation
            opportunities. The Change Engine is the underlying technology infrastructure that
            powers the platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">2. Information We Collect</h2>

          <h3 className="font-semibold text-lg mt-4">Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, email address, phone number, and mailing address</li>
            <li>Account registration details</li>
            <li>Payment information (processed securely through third-party payment processors)</li>
            <li>Content you submit, such as community feedback or suggested edits</li>
            <li>Communication preferences and survey responses</li>
          </ul>

          <h3 className="font-semibold text-lg mt-4">Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address, browser type, and device information</li>
            <li>Pages visited, time spent, and navigation patterns</li>
            <li>Language and location preferences</li>
            <li>Cookies and similar tracking technologies (see Section 7)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, maintain, and improve our programs, services, and platforms</li>
            <li>Personalize your experience, including language preferences and neighborhood-relevant content</li>
            <li>Communicate with you about programs, events, and community opportunities</li>
            <li>Analyze usage patterns to improve accessibility and relevance</li>
            <li>Fulfill legal and regulatory obligations</li>
            <li>Support fundraising and organizational sustainability</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">4. How We Share Your Information</h2>
          <p>
            <strong>We do not sell your personal information to third parties.</strong>
          </p>
          <p>We may share information with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Impact Hub Houston</strong> &mdash; our fiscal sponsor, for administrative and compliance purposes</li>
            <li><strong>Service providers</strong> &mdash; including hosting (Vercel, Supabase), analytics (Google Analytics), and email communication platforms, who process data on our behalf</li>
            <li><strong>Payment processors</strong> &mdash; to securely handle donations and transactions</li>
            <li><strong>Government or legal authorities</strong> &mdash; when required by law, subpoena, or legal process</li>
          </ul>
          <p>
            All service providers are contractually obligated to protect your information and use it
            only for the purposes we specify.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">5. Data Security</h2>
          <p>We implement industry-standard measures to protect your information, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Secure data transmission using SSL/TLS encryption</li>
            <li>Role-based access controls for internal systems</li>
            <li>Regular security assessments of our platforms</li>
            <li>Secure, encrypted data storage through our cloud providers</li>
          </ul>
          <p>
            While we take every reasonable precaution, no method of electronic transmission or
            storage is 100% secure. We encourage you to use strong passwords and exercise caution
            when sharing personal information online.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">6. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access</strong> the personal information we hold about you</li>
            <li><strong>Correct</strong> inaccurate or incomplete information</li>
            <li><strong>Delete</strong> your personal information, subject to legal retention requirements</li>
            <li><strong>Opt out</strong> of marketing communications at any time</li>
            <li><strong>Request portability</strong> of your data in a common format</li>
            <li><strong>Withdraw consent</strong> for data processing where consent is the legal basis</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:hello@thechangelab.net" className="text-brand-accent hover:underline">
              hello@thechangelab.net
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to remember your preferences (such as language
            selection), analyze traffic, and improve site performance. You can manage cookie
            preferences through your browser settings. Disabling cookies may affect certain features
            of our platforms.
          </p>
          <p>We use the following categories of cookies:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Essential cookies</strong> &mdash; required for core functionality such as authentication and language preferences</li>
            <li><strong>Analytics cookies</strong> &mdash; help us understand how visitors interact with our platforms</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">8. Children&rsquo;s Privacy</h2>
          <p>
            Our services are not directed to children under the age of 13. We do not knowingly
            collect personal information from children under 13. If you believe we have inadvertently
            collected such information, please contact us so we can promptly remove it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">9. Third-Party Links</h2>
          <p>
            Our platforms may contain links to external websites, services, and resources. We are not
            responsible for the privacy practices or content of third-party sites. We encourage you
            to review the privacy policies of any external site you visit.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make significant changes, we
            will notify you by posting the updated policy on our platforms with a revised effective
            date. Your continued use of our services after changes are posted constitutes your
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">11. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data
            practices, please contact us:
          </p>
          <address className="not-italic mt-3 space-y-1 text-sm">
            <p><strong>The Change Lab</strong></p>
            <p>c/o Impact Hub Houston</p>
            <p>4201 Main St., Suite L055-C</p>
            <p>Houston, Texas 77002, USA</p>
            <p>
              Email:{' '}
              <a href="mailto:hello@thechangelab.net" className="text-brand-accent hover:underline">
                hello@thechangelab.net
              </a>
            </p>
          </address>
        </section>
      </div>
    </div>
  )
}
