/**
 * @fileoverview Terms of Use page for The Change Lab, The Change Engine,
 * and the Change Engine.
 *
 * @route GET /terms
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 86400


export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for The Change Lab, The Change Engine, and the Change Engine.',
}

export default function TermsPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{  }} className="text-2xl sm:text-3xl mt-2">Terms of Use</h1>
          <p style={{ color: "#5c6474" }} className="text-sm mt-2">Effective Date: March 4, 2026</p>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>Terms of Use</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="space-y-8" style={{  }}>
          <section>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              Welcome to <strong style={{  }}>The Change Lab</strong>, <strong style={{  }}>The Change Engine</strong>{' '}
              (www.changeengine.us), and the <strong style={{  }}>Change Engine</strong> (collectively, the
              &ldquo;Platforms&rdquo;). These Terms of Use (&ldquo;Terms&rdquo;) govern your access to
              and use of our websites, applications, and services. By using the Platforms, you agree to
              these Terms. If you do not agree, please do not use our Platforms.
            </p>
            <p className="leading-relaxed mt-3" style={{ color: "#5c6474" }}>
              The Change Lab operates as a nonprofit initiative under the fiscal sponsorship of{' '}
              <strong style={{  }}>Impact Hub Houston</strong>, located at 4201 Main St., Suite L055-C, Houston,
              Texas 77002, USA.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">1. Our Mission and Values</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              The Platforms exist to bridge divides and build community across Houston. We believe that
              diverse people need not vote the same way or share the same background to belong here.
              Everything we build is grounded in the following commitments:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3" style={{ color: "#5c6474" }}>
              <li><strong style={{  }}>Belonging Before Agreement</strong> -- Everyone deserves a seat at the table, regardless of background, beliefs, or political affiliation.</li>
              <li><strong style={{  }}>Connection First</strong> -- Real change starts with relationships and trust between neighbors.</li>
              <li><strong style={{  }}>The Whole Story</strong> -- We seek complete, honest, and contextualized information rather than simplified narratives.</li>
              <li><strong style={{  }}>Responsibility &amp; Fairness</strong> -- We hold ourselves and institutions accountable while centering equity and justice.</li>
              <li><strong style={{  }}>Imagination &amp; Tradition Together</strong> -- We honor what has come before while daring to envision what could be.</li>
              <li><strong style={{  }}>Practice, Not Perfection</strong> -- We learn by doing, welcome feedback, and grow through iteration.</li>
              <li><strong style={{  }}>Shared Work, Shared Future</strong> -- Community well-being is a collective responsibility.</li>
              <li><strong style={{  }}>Local Pride, Global Learning</strong> -- We are rooted in Houston and informed by ideas and solutions from around the world.</li>
            </ul>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">2. Eligibility</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              You must be at least 13 years old to use our Platforms. If you are under 18, you may
              only use the Platforms with the involvement of a parent or legal guardian. By using the
              Platforms, you represent that you meet these requirements.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">3. Account Registration</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              Some features may require you to create an account. You agree to provide accurate and
              complete information, keep your login credentials secure, and notify us promptly of any
              unauthorized use of your account. You are responsible for all activity under your
              account.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">4. License to Use the Platforms</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              We grant you a <strong style={{  }}>limited, non-exclusive, non-transferable, revocable license</strong>{' '}
              to access and use the Platforms for personal, non-commercial, community-building
              purposes, subject to these Terms.
            </p>
            <p className="leading-relaxed mt-3" style={{ color: "#5c6474" }}>
              You may share content from the Platforms provided you give proper attribution and link
              back to the original source on our website. You may not reproduce, distribute, or
              create derivative works of our content for commercial purposes without prior written
              permission.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">5. User Contributions</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              The Platforms may allow you to submit feedback, suggested edits, comments, or other
              content (&ldquo;User Contributions&rdquo;). By submitting a User Contribution, you
              grant us a non-exclusive, royalty-free, perpetual, worldwide license to use, display,
              modify, and distribute your contribution in connection with our mission and the
              operation of the Platforms.
            </p>
            <p className="leading-relaxed mt-3" style={{ color: "#5c6474" }}>
              You represent that your User Contributions are original, do not infringe on the rights
              of others, and comply with these Terms.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">6. Prohibited Uses</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>When using the Platforms, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2" style={{ color: "#5c6474" }}>
              <li>Promote hate, discrimination, or harassment based on race, ethnicity, gender, religion, sexual orientation, disability, or any other protected characteristic</li>
              <li>Post or share disinformation, extremist content, or calls to violence</li>
              <li>Use the Platforms for commercial purposes without our written permission</li>
              <li>Misrepresent your affiliation with The Change Lab, The Change Engine, or the Change Engine</li>
              <li>Take content out of context in ways that contradict our mission or values</li>
              <li>Attempt to gain unauthorized access to our systems, accounts, or data</li>
              <li>Use automated tools (bots, scrapers, etc.) to access the Platforms without our prior consent</li>
              <li>Interfere with or disrupt the operation of the Platforms</li>
            </ul>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">7. Third-Party Content and Links</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              The Platforms may contain links to third-party websites, resources, and services. We
              provide these links for informational purposes and do not endorse or assume
              responsibility for the content, privacy practices, or terms of any third-party site.
              Your interactions with third-party sites are governed by their own terms and policies.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">8. Intellectual Property</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              All content, design, graphics, trademarks, and other materials on the Platforms
              (excluding User Contributions) are the property of The Change Lab or its licensors and
              are protected by applicable intellectual property laws. You may not use our trademarks,
              logos, or branding without prior written permission.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">9. Privacy</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              Your use of the Platforms is also governed by our{' '}
              <a href="/privacy" style={{ color: "#1b5e8a" }} className="hover:underline">
                Privacy Policy
              </a>
              , which describes how we collect, use, and protect your information. By using the
              Platforms, you consent to the practices described in the Privacy Policy.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">10. Disclaimers and Limitation of Liability</h2>

            <h3 style={{  }} className="text-lg mt-4 mb-2">10.1 Disclaimer of Warranties</h3>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              The Platforms and all content are provided <strong style={{  }}>&ldquo;as is&rdquo;</strong> and{' '}
              <strong style={{  }}>&ldquo;as available&rdquo;</strong> without warranties of any kind, either
              express or implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement.
            </p>

            <h3 style={{  }} className="text-lg mt-4 mb-2">10.2 Informational Purposes</h3>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              Content on the Platforms is provided for general informational and community-building
              purposes. It does not constitute legal, financial, medical, or professional advice. We
              encourage you to consult qualified professionals for specific guidance.
            </p>

            <h3 style={{  }} className="text-lg mt-4 mb-2">10.3 Limitation of Liability</h3>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              To the fullest extent permitted by law, The Change Lab, Impact Hub Houston, and their
              respective officers, directors, employees, and agents shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your use
              of the Platforms. Our total aggregate liability for all claims shall not exceed $100.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">11. Indemnification</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              You agree to indemnify and hold harmless The Change Lab, Impact Hub Houston, and their
              respective officers, directors, employees, and agents from any claims, liabilities,
              damages, losses, and expenses (including reasonable attorneys&rsquo; fees) arising from
              your use of the Platforms or your violation of these Terms.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">12. Termination</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              We may suspend or terminate your access to the Platforms at our discretion, without
              notice, for conduct that we determine violates these Terms or is harmful to our
              community, other users, or our mission. You may stop using the Platforms at any time.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">13. Governing Law</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              These Terms are governed by the laws of the State of Texas, without regard to conflict
              of law principles. Any disputes arising under these Terms shall be resolved in the
              courts located in Harris County, Texas.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">14. Changes to These Terms</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              We may update these Terms from time to time. When we make significant changes, we will
              post the revised Terms on the Platforms with an updated effective date. Your continued
              use of the Platforms after changes are posted constitutes your acceptance of the updated
              Terms.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #dde1e8' }} />

          <section>
            <h2 style={{  }} className="text-xl mb-3">15. Contact Us</h2>
            <p className="leading-relaxed" style={{ color: "#5c6474" }}>
              If you have questions or concerns about these Terms, please contact us:
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
              <p>Phone: 713-416-2633</p>
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
