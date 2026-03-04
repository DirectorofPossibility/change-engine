/**
 * @fileoverview Terms of Use page for The Change Lab, The Change Engine,
 * and the Community Exchange.
 *
 * @route GET /terms
 */
import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for The Change Lab, The Change Engine, and the Community Exchange.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: 'Terms of Use' }]} />

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mt-6 mb-2">
        Terms of Use
      </h1>
      <p className="text-sm text-brand-muted mb-8">Effective Date: March 4, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-brand-text">
        <section>
          <p>
            Welcome to <strong>The Change Lab</strong>, <strong>The Change Engine</strong>{' '}
            (www.changeengine.us), and the <strong>Community Exchange</strong> (collectively, the
            &ldquo;Platforms&rdquo;). These Terms of Use (&ldquo;Terms&rdquo;) govern your access to
            and use of our websites, applications, and services. By using the Platforms, you agree to
            these Terms. If you do not agree, please do not use our Platforms.
          </p>
          <p>
            The Change Lab operates as a nonprofit initiative under the fiscal sponsorship of{' '}
            <strong>Impact Hub Houston</strong>, located at 4201 Main St., Suite L055-C, Houston,
            Texas 77002, USA.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">1. Our Mission and Values</h2>
          <p>
            The Platforms exist to bridge divides and build community across Houston. We believe that
            diverse people need not vote the same way or share the same background to belong here.
            Everything we build is grounded in the following commitments:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Belonging Before Agreement</strong> &mdash; Everyone deserves a seat at the
              table, regardless of background, beliefs, or political affiliation.
            </li>
            <li>
              <strong>Connection First</strong> &mdash; Real change starts with relationships and
              trust between neighbors.
            </li>
            <li>
              <strong>The Whole Story</strong> &mdash; We seek complete, honest, and contextualized
              information rather than simplified narratives.
            </li>
            <li>
              <strong>Responsibility &amp; Fairness</strong> &mdash; We hold ourselves and
              institutions accountable while centering equity and justice.
            </li>
            <li>
              <strong>Imagination &amp; Tradition Together</strong> &mdash; We honor what has come
              before while daring to envision what could be.
            </li>
            <li>
              <strong>Practice, Not Perfection</strong> &mdash; We learn by doing, welcome feedback,
              and grow through iteration.
            </li>
            <li>
              <strong>Shared Work, Shared Future</strong> &mdash; Community well-being is a
              collective responsibility.
            </li>
            <li>
              <strong>Local Pride, Global Learning</strong> &mdash; We are rooted in Houston and
              informed by ideas and solutions from around the world.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use our Platforms. If you are under 18, you may
            only use the Platforms with the involvement of a parent or legal guardian. By using the
            Platforms, you represent that you meet these requirements.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">3. Account Registration</h2>
          <p>
            Some features may require you to create an account. You agree to provide accurate and
            complete information, keep your login credentials secure, and notify us promptly of any
            unauthorized use of your account. You are responsible for all activity under your
            account.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">4. License to Use the Platforms</h2>
          <p>
            We grant you a <strong>limited, non-exclusive, non-transferable, revocable license</strong>{' '}
            to access and use the Platforms for personal, non-commercial, community-building
            purposes, subject to these Terms.
          </p>
          <p>
            You may share content from the Platforms provided you give proper attribution and link
            back to the original source on our website. You may not reproduce, distribute, or
            create derivative works of our content for commercial purposes without prior written
            permission.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">5. User Contributions</h2>
          <p>
            The Platforms may allow you to submit feedback, suggested edits, comments, or other
            content (&ldquo;User Contributions&rdquo;). By submitting a User Contribution, you
            grant us a non-exclusive, royalty-free, perpetual, worldwide license to use, display,
            modify, and distribute your contribution in connection with our mission and the
            operation of the Platforms.
          </p>
          <p>
            You represent that your User Contributions are original, do not infringe on the rights
            of others, and comply with these Terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">6. Prohibited Uses</h2>
          <p>When using the Platforms, you agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Promote hate, discrimination, or harassment based on race, ethnicity, gender, religion, sexual orientation, disability, or any other protected characteristic</li>
            <li>Post or share disinformation, extremist content, or calls to violence</li>
            <li>Use the Platforms for commercial purposes without our written permission</li>
            <li>Misrepresent your affiliation with The Change Lab, The Change Engine, or the Community Exchange</li>
            <li>Take content out of context in ways that contradict our mission or values</li>
            <li>Attempt to gain unauthorized access to our systems, accounts, or data</li>
            <li>Use automated tools (bots, scrapers, etc.) to access the Platforms without our prior consent</li>
            <li>Interfere with or disrupt the operation of the Platforms</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">7. Third-Party Content and Links</h2>
          <p>
            The Platforms may contain links to third-party websites, resources, and services. We
            provide these links for informational purposes and do not endorse or assume
            responsibility for the content, privacy practices, or terms of any third-party site.
            Your interactions with third-party sites are governed by their own terms and policies.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">8. Intellectual Property</h2>
          <p>
            All content, design, graphics, trademarks, and other materials on the Platforms
            (excluding User Contributions) are the property of The Change Lab or its licensors and
            are protected by applicable intellectual property laws. You may not use our trademarks,
            logos, or branding without prior written permission.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">9. Privacy</h2>
          <p>
            Your use of the Platforms is also governed by our{' '}
            <a href="/privacy" className="text-brand-accent hover:underline">
              Privacy Policy
            </a>
            , which describes how we collect, use, and protect your information. By using the
            Platforms, you consent to the practices described in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">10. Disclaimers and Limitation of Liability</h2>

          <h3 className="font-semibold text-lg mt-4">10.1 Disclaimer of Warranties</h3>
          <p>
            The Platforms and all content are provided <strong>&ldquo;as is&rdquo;</strong> and{' '}
            <strong>&ldquo;as available&rdquo;</strong> without warranties of any kind, either
            express or implied, including but not limited to implied warranties of merchantability,
            fitness for a particular purpose, and non-infringement.
          </p>

          <h3 className="font-semibold text-lg mt-4">10.2 Informational Purposes</h3>
          <p>
            Content on the Platforms is provided for general informational and community-building
            purposes. It does not constitute legal, financial, medical, or professional advice. We
            encourage you to consult qualified professionals for specific guidance.
          </p>

          <h3 className="font-semibold text-lg mt-4">10.3 Limitation of Liability</h3>
          <p>
            To the fullest extent permitted by law, The Change Lab, Impact Hub Houston, and their
            respective officers, directors, employees, and agents shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use
            of the Platforms. Our total aggregate liability for all claims shall not exceed $100.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless The Change Lab, Impact Hub Houston, and their
            respective officers, directors, employees, and agents from any claims, liabilities,
            damages, losses, and expenses (including reasonable attorneys&rsquo; fees) arising from
            your use of the Platforms or your violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">12. Termination</h2>
          <p>
            We may suspend or terminate your access to the Platforms at our discretion, without
            notice, for conduct that we determine violates these Terms or is harmful to our
            community, other users, or our mission. You may stop using the Platforms at any time.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Texas, without regard to conflict
            of law principles. Any disputes arising under these Terms shall be resolved in the
            courts located in Harris County, Texas.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. When we make significant changes, we will
            post the revised Terms on the Platforms with an updated effective date. Your continued
            use of the Platforms after changes are posted constitutes your acceptance of the updated
            Terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">15. Contact Us</h2>
          <p>
            If you have questions or concerns about these Terms, please contact us:
          </p>
          <address className="not-italic mt-3 space-y-1 text-sm">
            <p><strong>The Change Lab</strong></p>
            <p>c/o Impact Hub Houston</p>
            <p>4201 Main St., Suite L055-C</p>
            <p>Houston, Texas 77002, USA</p>
            <p>
              Email:{' '}
              <a href="mailto:hello@changelab.net" className="text-brand-accent hover:underline">
                hello@changelab.net
              </a>
            </p>
            <p>Phone: 713-416-2633</p>
          </address>
        </section>
      </div>
    </div>
  )
}
