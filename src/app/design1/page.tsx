'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { dictionaries } from '@/lib/i18n'
import { LANGUAGES } from '@/lib/constants'

function t(key: string, lang: string): string {
  const dict = dictionaries[lang as keyof typeof dictionaries] ?? dictionaries.en
  return dict[key] ?? dictionaries.en[key] ?? key
}

export default function Design1Page() {
  const { language, setLanguage } = useLanguage()

  const doors = [
    { key: 'about.learn', color: '#2A6CB5', href: '/pathways' },
    { key: 'about.connect', color: '#C46A1F', href: '/services' },
    { key: 'about.attend', color: '#2E8B57', href: '/calendar' },
    { key: 'about.organize', color: '#7044B5', href: '/officials' },
  ]

  const goals = [
    t('about.goal_1', language),
    t('about.goal_2', language),
    t('about.goal_3', language),
  ]

  return (
    <div className="min-h-screen" style={{ background: '#F0EBE1', fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Edgy CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&family=DM+Serif+Display:ital@0;1&family=Space+Mono:wght@400;700&display=swap');
        .d1-scribble {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='14' viewBox='0 0 200 14'%3E%3Cpath d='M2 9 C30 3, 55 12, 90 5 S150 11, 198 4' stroke='%23D94F2B' stroke-width='3.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: repeat-x; background-position: bottom left;
          background-size: 140px 12px; padding-bottom: 10px;
        }
        .d1-door { transition: background 0.2s; position: relative; }
        .d1-door::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.19,1,0.22,1);
        }
        .d1-door:hover::after { transform: scaleX(1); }
        .d1-door:hover { background: rgba(217,79,43,0.06); }
        .d1-section { transition: background 0.2s; }
        .d1-section:hover { background: #FDFAF5; }
        .d1-goal { transition: all 0.15s; }
        .d1-goal:hover { transform: translateX(6px); }
        .d1-lang-btn { transition: all 0.15s; }
        .d1-lang-btn:hover { opacity: 1 !important; }
      `}</style>

      {/* ── HEADER ── */}
      <header
        className="flex items-center sticky top-0 z-50"
        style={{
          background: '#FDFAF5',
          borderBottom: '2px solid #1a1a1a',
          padding: '0 48px',
          height: 56,
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline mr-8">
          <svg width="26" height="26" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="18" stroke="#D94F2B" strokeWidth="2.5"/>
            <circle cx="100" cy="80" r="18" stroke="#C43B3B" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="100" cy="120" r="18" stroke="#2A8F8F" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="117.3" cy="90" r="18" stroke="#C46A1F" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="117.3" cy="110" r="18" stroke="#2A6CB5" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="82.7" cy="90" r="18" stroke="#B8911E" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="82.7" cy="110" r="18" stroke="#7044B5" strokeWidth="1.5" opacity="0.5"/>
          </svg>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: '#1a1a1a' }}>
            Community Exchange
          </span>
        </Link>

        <nav className="flex gap-0 mr-auto">
          {doors.map(function (d) {
            return (
              <Link
                key={d.key}
                href={d.href}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 2,
                  color: '#9E9488',
                  padding: '16px 18px',
                  textDecoration: 'none',
                  borderBottom: '3px solid transparent',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={function (e) { e.currentTarget.style.color = '#1a1a1a' }}
                onMouseLeave={function (e) { e.currentTarget.style.color = '#9E9488' }}
              >
                {t(d.key, language)}
              </Link>
            )
          })}
        </nav>

        {/* Language toggle */}
        <div className="flex items-center gap-0.5" style={{ border: '1px solid #D4CEC4', background: '#F0EBE1' }}>
          {LANGUAGES.map(function (l) {
            const isActive = language === l.code
            return (
              <button
                key={l.code}
                onClick={function () { setLanguage(l.code as 'en' | 'es' | 'vi') }}
                className="d1-lang-btn"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1,
                  padding: '6px 14px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? '#D94F2B' : 'transparent',
                  color: isActive ? '#fff' : '#9E9488',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {l.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: '80px 80px 48px', borderBottom: '2px solid #1a1a1a' }}>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: 3,
            color: '#D94F2B',
            marginBottom: 16,
          }}
        >
          {t('about.powered_by', language)}
        </div>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '5.5vw',
            lineHeight: 0.95,
            color: '#1a1a1a',
            letterSpacing: '-0.03em',
            maxWidth: 700,
          }}
        >
          {t('about.hero', language).split('Community Exchange').map(function (part, i, arr) {
            if (i < arr.length - 1) {
              return (
                <span key={i}>
                  {part}
                  <em className="d1-scribble" style={{ fontStyle: 'italic', color: '#D94F2B' }}>
                    Community Exchange
                  </em>
                </span>
              )
            }
            return <span key={i}>{part}</span>
          })}
        </h1>
      </section>

      {/* ── INTRO ── */}
      <section style={{ padding: '48px 80px', borderBottom: '2px solid #1a1a1a', maxWidth: 800 }}>
        <p style={{ fontSize: 18, lineHeight: 1.8, color: '#444' }}>
          {t('about.intro', language)}
        </p>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="d1-section" style={{ padding: '48px 80px', borderBottom: '2px solid #1a1a1a' }}>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '3vw',
            lineHeight: 1,
            color: '#1a1a1a',
            marginBottom: 16,
          }}
        >
          {t('about.what_we_do', language)}
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.85, color: '#444', maxWidth: 640 }}>
          {t('about.what_we_do_text', language)}
        </p>
      </section>

      {/* ── THE COMMUNITY EXCHANGE ── */}
      <section style={{ borderBottom: '2px solid #1a1a1a' }}>
        <div style={{ padding: '48px 80px', borderBottom: '1px solid #D4CEC4' }}>
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '3vw',
              lineHeight: 1,
              marginBottom: 20,
            }}
          >
            {t('about.exchange_title', language)}
          </h2>
          <div style={{ fontSize: 16, lineHeight: 1.85, color: '#444', maxWidth: 640 }}>
            <p style={{ marginBottom: 16 }}>{t('about.exchange_p1', language)}</p>
            <p style={{ marginBottom: 16 }}>{t('about.exchange_p2', language)}</p>
          </div>
          {/* Callout */}
          <div
            style={{
              borderLeft: '5px solid #D94F2B',
              background: 'rgba(217,79,43,0.06)',
              padding: '18px 24px',
              maxWidth: 640,
              marginTop: 8,
            }}
          >
            <p
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.6,
                color: '#1a1a1a',
              }}
            >
              {t('about.exchange_p3', language)}
            </p>
          </div>
        </div>

        {/* 4 Doors strip */}
        <div className="grid grid-cols-4 gap-0">
          {doors.map(function (d, i) {
            return (
              <Link
                key={d.key}
                href={d.href}
                className="d1-door"
                style={{
                  padding: '24px 28px',
                  borderRight: i < 3 ? '1px solid #D4CEC4' : 'none',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: 3,
                    color: d.color,
                    marginBottom: 4,
                  }}
                >
                  0{i + 1}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 24,
                    color: '#1a1a1a',
                  }}
                >
                  {t(d.key, language)}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: d.color }} className="after:content-['']" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── CIVIC AND SOCIAL CLUB ── */}
      <section className="d1-section" style={{ padding: '48px 80px', borderBottom: '2px solid #1a1a1a' }}>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '3vw',
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          {t('about.club_title', language)}
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.85, color: '#444', maxWidth: 640 }}>
          {t('about.club_text', language)}
        </p>
      </section>

      {/* ── WHY IT MATTERS ── */}
      <section className="d1-section" style={{ padding: '48px 80px', borderBottom: '2px solid #1a1a1a' }}>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '3vw',
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          {t('about.why_title', language)}
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.85, color: '#444', maxWidth: 640 }}>
          {t('about.why_text', language)}
        </p>
      </section>

      {/* ── WHERE WE'RE HEADED ── */}
      <section style={{ borderBottom: '2px solid #1a1a1a' }}>
        <div style={{ padding: '48px 80px 24px' }}>
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '3vw',
              lineHeight: 1,
              marginBottom: 24,
            }}
          >
            {t('about.where_title', language)}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-0" style={{ borderTop: '1px solid #D4CEC4' }}>
          {goals.map(function (goal, i) {
            return (
              <div
                key={i}
                className="d1-goal"
                style={{
                  padding: '28px 32px',
                  borderRight: i < 2 ? '1px solid #D4CEC4' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 36,
                    color: '#D94F2B',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 18,
                    color: '#1a1a1a',
                    lineHeight: 1.3,
                    paddingTop: 6,
                  }}
                >
                  {goal}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '20px 80px 40px' }}>
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: 2,
              color: '#9E9488',
            }}
          >
            {t('about.measure', language)}
          </p>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={{ padding: '40px 80px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h3
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 20,
              color: '#1a1a1a',
            }}
          >
            {t('about.contact', language)}
          </h3>
          <a
            href="mailto:hello@thechangelab.net"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: 2,
              color: '#D94F2B',
              textDecoration: 'none',
              padding: '10px 24px',
              border: '2px solid #D94F2B',
              transition: 'all 0.15s',
            }}
            onMouseEnter={function (e) {
              e.currentTarget.style.background = '#D94F2B'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={function (e) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#D94F2B'
            }}
          >
            hello@thechangelab.net
          </a>
        </div>
      </section>
    </div>
  )
}
