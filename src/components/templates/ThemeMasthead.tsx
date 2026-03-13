import { Geo } from '@/components/geo/sacred'

interface ThemeMastheadProps {
  themeName: string
  themeColor: string
  colorDk?: string
  colorLt?: string
  description: string
  geoType?: string
  dateline?: string
  stats?: Array<{ num: string; desc: string }>
}

/**
 * Dark gradient masthead for Theme Hub pages.
 * Matches the .theme-mast spec from the design system.
 */
export function ThemeMasthead({
  themeName,
  themeColor,
  colorDk,
  colorLt,
  description,
  geoType = 'seed_of_life',
  dateline,
  stats,
}: ThemeMastheadProps) {
  const dk = colorDk || darken(themeColor)
  const mid = midTone(themeColor, dk)

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(158deg, ${dk} 0%, ${mid} 50%, ${themeColor} 100%)`,
        padding: '3.5rem 1.5rem 3rem',
      }}
    >
      {/* Background geo SVGs */}
      <div
        className="absolute pointer-events-none animate-[spin_120s_linear_infinite]"
        style={{
          top: '50%', right: '-60px',
          transform: 'translateY(-50%)',
          width: '380px', height: '380px', opacity: 0.1,
        }}
      >
        <Geo type={geoType} size={380} color="#ffffff" opacity={0.6} />
      </div>
      <div
        className="absolute pointer-events-none animate-[spin_90s_linear_infinite_reverse]"
        style={{
          bottom: '-60px', left: '-40px',
          width: '240px', height: '240px', opacity: 0.05,
        }}
      >
        <Geo type="seed_of_life" size={240} color="#ffffff" opacity={0.5} />
      </div>

      <div className="max-w-[1080px] mx-auto relative z-[2]">
        {/* Dateline */}
        {dateline && (
          <div className="flex items-center gap-3 mb-3">
            <span className="block w-6 h-px" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.24em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {dateline}
            </span>
          </div>
        )}

        {/* Headline */}
        <h1
          className="font-display font-black leading-[0.95] tracking-[-0.025em] text-white mb-5"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}
        >
          The State of{' '}
          <em className="block" style={{ color: colorLt || lighten(themeColor) }}>
            {themeName}
          </em>{' '}
          in Houston
        </h1>

        {/* Rule */}
        <div className="w-[50px] h-[2px] mb-5" style={{ background: 'rgba(255,255,255,0.3)' }} />

        {/* Deck */}
        <p
          className="font-body italic text-base leading-[1.7] max-w-[560px] mb-8"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {description}
        </p>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div
            className="flex flex-wrap max-w-[640px]"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex-1 min-w-[140px] px-6 py-4"
                style={{
                  borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.12)' : undefined,
                }}
              >
                <span
                  className="font-display font-black text-[2rem] leading-none block"
                  style={{ color: colorLt || lighten(themeColor) }}
                >
                  {s.num}
                </span>
                <span
                  className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] mt-1 block"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple color helpers — no external deps
function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.max(0, Math.floor(r * 0.35)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(g * 0.35)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(b * 0.35)).toString(16).padStart(2, '0')}`
}

function midTone(hex: string, dk: string): string {
  const r1 = parseInt(dk.slice(1, 3), 16)
  const g1 = parseInt(dk.slice(3, 5), 16)
  const b1 = parseInt(dk.slice(5, 7), 16)
  const r2 = parseInt(hex.slice(1, 3), 16)
  const g2 = parseInt(hex.slice(3, 5), 16)
  const b2 = parseInt(hex.slice(5, 7), 16)
  return `#${Math.floor((r1 + r2) / 2).toString(16).padStart(2, '0')}${Math.floor((g1 + g2) / 2).toString(16).padStart(2, '0')}${Math.floor((b1 + b2) / 2).toString(16).padStart(2, '0')}`
}

function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.min(255, Math.floor(r + (255 - r) * 0.55)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(g + (255 - g) * 0.55)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(b + (255 - b) * 0.55)).toString(16).padStart(2, '0')}`
}
