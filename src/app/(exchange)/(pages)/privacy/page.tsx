/**
 * @fileoverview Privacy Policy page for The Change Lab, The Change Engine,
 * and the Change Engine.
 *
 * @route GET /privacy
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 86400


export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for The Change Lab, The Change Engine, and the Change Engine.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{  }} className="text-2xl sm:text-3xl mt-2">Privacy Policy</h1>
          <p style={{ color: "#5c6474" }} className="text-sm mt-2">Effective Date: March 4, 2026</p>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>Privacy Policy</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="space-y-8" style={{  }}>
          <section>
            <p className="leading-relaxed">
              This Privacy Policy describes how <strong>The Change Lab</strong> (operating through its
              fiscal sponsor, <strong>Impact Hub Houston</strong>), its digital platform{' '}
              <strong>The Change Engine</strong> (www.changeengine.us), and the{' '}
              <strong>Change Engine</strong> (collectively, &ldquo;we,&rdquo; &ldquo;us,&rdquo;
              or &ldquo;our&rdquo;) collect, use, and protect information when you use our websites,
              applications, and services.
            </p>
            <p className="leading-relaxed mt-3">
              We are committed to transparency and to safeguarding the information entrusted to us by
              the communities we serve.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">1. Who We Are</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              The Change Lab is a nonprofit initiative operating under the fiscal sponsorship of{' '}
              <strong style={{  }}>Impact Hub Houston</strong>, located at 4201 Main St., Suite L055-C, Houston,
              Texas 77002, USA. Change Engine is our civic discovery platform at changeengine.us,
              connecting Houston residents with resources, services, and civic participation
              opportunities. The Change Engine is the underlying technology infrastructure that
              powers the platform.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">2. Information We Collect</h2>

            <h3 style={{  }} className="text-lg mt-4 mb-2">Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1" style={{ color: "#5c6474" }}>
              <li>Name, email address, phone number, and mailing address</li>
              <li>Account registration details</li>
              <li>Payment information (processed securely through third-party payment processors)</li>
              <li>Content you submit, such as community feedback or suggested edits</li>
              <li>Communication preferences and survey responses</li>
            </ul>

            <h3 style={{  }} className="text-lg mt-4 mb-2">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1" style={{ color: "#5c6474" }}>
              <li>IP address, browser type, and device information</li>
              <li>Pages visited, time spent, and navigation patterns</li>
              <li>Language and location preferences</li>
              <li>Cookies and similar tracking technologies (see Section 7)</li>
            </ul>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1" style={{ color: "#5c6474" }}>
              <li>Provide, maintain, and improve our programs, services, and platforms</li>
              <li>Personalize your experience, including language preferences and neighborhood-relevant content</li>
              <li>Communicate with you about programs, events, and community opportunities</li>
              <li>Analyze usage patterns to improve accessibility and relevance</li>
              <li>Fulfill legal and regulatory obligations</li>
              <li>Support fundraising and organizational sustainability</li>
            </ul>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">4. How We Share Your Information</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              <strong style={{  }}>We do not sell your personal information to third parties.</strong>
            </p>
            <p className="leading-relaxed mt-2" style={{ color: "#5c6474" }}>We may share information with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2" style={{ color: "#5c6474" }}>
              <li><strong style={{  }}>Impact Hub Houston</strong> -- our fiscal sponsor, for administrative and compliance purposes</li>
              <li><strong style={{  }}>Service providers</strong> -- including hosting (Vercel, Supabase), analytics (Google Analytics), and email communication platforms, who process data on our behalf</li>
              <li><strong style={{  }}>Payment processors</strong> -- to securely handle donations and transactions</li>
              <li><strong style={{  }}>Government or legal authorities</strong> -- when required by law, subpoena, or legal process</li>
            </ul>
            <p className="leading-relaxed mt-3" style={{ color: "#5c6474" }}>
              All service providers are contractually obligated to protect your information and use it
              only for the purposes we specify.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">5. Data Security</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>We implement industry-standard measures to protect your information, including:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2" style={{ color: "#5c6474" }}>
              <li>Secure data transmission using SSL/TLS encryption</li>
              <li>Role-based access controls for internal systems</li>
              <li>Regular security assessments of our platforms</li>
              <li>Secure, encrypted data storage through our cloud providers</li>
            </ul>
            <p className="leading-relaxed mt-3" style={{ color: "#5c6474" }}>
              While we take every reasonable precaution, no method of electronic transmission or
              storage is 100% secure. We encourage you to use strong passwords and exercise caution
              when sharing personal information online.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">6. Your Rights and Choices</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2" style={{ color: "#5c6474" }}>
              <li><strong style={{  }}>Access</strong> the personal information we hold about you</li>
              <li><strong style={{  }}>Correct</strong> inaccurate or incomplete information</li>
              <li><strong style={{  }}>Delete</strong> your personal information, subject to legal retention requirements</li>
              <li><strong style={{  }}>Opt out</strong> of marketing communications at any time</li>
              <li><strong style={{  }}>Request portability</strong> of your data in a common format</li>
              <li><strong style={{  }}>Withdraw consent</strong> for data processing where consent is the legal basis</li>
            </ul>
            <p className="leading-relaxed mt-3" style={{ color: "#5c6474" }}>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:hello@thechangelab.net" style={{ color: "#1b5e8a" }} className="hover:underline">
                hello@thechangelab.net
              </a>.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">7. Cookies and Tracking</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              We use cookies and similar technologies to remember your preferences (such as language
              selection), analyze traffic, and improve site performance. You can manage cookie
              preferences through your browser settings. Disabling cookies may affect certain features
              of our platforms.
            </p>
            <p className="leading-relaxed mt-3" style={{ color: "#5c6474" }}>We use the following categories of cookies:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2" style={{ color: "#5c6474" }}>
              <li><strong style={{  }}>Essential cookies</strong> -- required for core functionality such as authentication and language preferences</li>
              <li><strong style={{  }}>Analytics cookies</strong> -- help us understand how visitors interact with our platforms</li>
            </ul>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">8. Children&rsquo;s Privacy</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              Our services are not directed to children under the age of 13. We do not knowingly
              collect personal information from children under 13. If you believe we have inadvertently
              collected such information, please contact us so we can promptly remove it.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">9. Third-Party Links</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              Our platforms may contain links to external websites, services, and resources. We are not
              responsible for the privacy practices or content of third-party sites. We encourage you
              to review the privacy policies of any external site you visit.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">10. Changes to This Policy</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              We may update this Privacy Policy from time to time. When we make significant changes, we
              will notify you by posting the updated policy on our platforms with a revised effective
              date. Your continued use of our services after changes are posted constitutes your
              acceptance of the updated policy.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">11. Contact Us</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please contact us:
            </p>
            <address className="not-italic mt-3 space-y-1 text-sm" style={{ color: "#5c6474" }}>
              <p><strong style={{  }}>The Change Lab</strong></p>
              <p>c/o Impact Hub Houston</p>
              <p>4201 Main St., Suite L055-C</p>
              <p>Houston, Texas 77002, USA</p>
              <p>
                Email:{' '}
                <a href="mailto:hello@thechangelab.net" style={{ color: "#1b5e8a" }} className="hover:underline">
                  hello@thechangelab.net
                </a>
              </p>
            </address>
          </section>
        </div>
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid #dde1e8' }} className="pt-4">
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
