import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 86400


export const metadata: Metadata = {
  title: 'Contact Us -- Change Engine',
  description: 'Get in touch with The Change Lab team.',
}

export default function ContactPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{  }} className="text-2xl sm:text-3xl mt-2">Contact Us</h1>
          <p style={{ color: "#5c6474" }} className="text-base mt-2">
            Have a question, suggestion, or want to partner with us? We would love to hear from you.
          </p>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>Contact</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6" style={{ border: '1px solid #dde1e8' }}>
            <h2 style={{ color: "#5c6474" }} className="text-sm uppercase tracking-wide mb-4">The Change Lab</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span style={{ color: "#5c6474" }}>Email</span>
                <a href="mailto:hello@thechangelab.net" style={{ color: "#1b5e8a" }} className="hover:underline">hello@thechangelab.net</a>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ color: "#5c6474" }}>Location</span>
                <span style={{  }}>Houston, Texas</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#5c6474" }}>Web</span>
                <a href="https://www.changeengine.us" style={{ color: "#1b5e8a" }} className="hover:underline">www.changeengine.us</a>
              </div>
            </div>
          </div>
          <div className="p-6" style={{ border: '1px solid #dde1e8' }}>
            <h2 style={{ color: "#5c6474" }} className="text-sm uppercase tracking-wide mb-4">Ways to Connect</h2>
            <ul className="space-y-3 text-sm" style={{  }}>
              <li><strong style={{  }}>Report an issue</strong> -- Something wrong or outdated? Let us know.</li>
              <li><strong style={{  }}>Suggest content</strong> -- Know a resource we should feature? Share it.</li>
              <li><strong style={{  }}>Partner with us</strong> -- Organizations and agencies can join the Exchange.</li>
              <li><strong style={{  }}>Volunteer</strong> -- Help us build a better civic platform for Houston.</li>
            </ul>
          </div>
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
