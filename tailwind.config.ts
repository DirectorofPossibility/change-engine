import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAF8F5',
          'bg-alt': '#EDE8E0',
          cream: '#FBF9F6',
          text: '#1A1A1A',
          accent: '#C75B2A',
          'accent-hover': '#B5481A',
          muted: '#6B6560',
          'muted-light': '#9B9590',
          border: '#E2DDD5',
          card: '#FFFFFF',
          success: '#2D8659',
          warning: '#C47D1A',
          danger: '#c43c4c',
          dark: '#3A3A3A',
          sand: '#D5D0C8',
          warm: '#B5AFA8',
        },
        theme: {
          health: '#e53e3e',
          families: '#dd6b20',
          neighborhood: '#d69e2e',
          voice: '#38a169',
          money: '#3182ce',
          planet: '#319795',
          bigger: '#805ad5',
        },
        center: {
          community: '#805ad5',
          learning: '#3182ce',
          resource: '#C75B2A',
          action: '#38a169',
        },
        sidebar: {
          bg: '#3A3A3A',
          active: 'rgba(199,91,42,0.2)',
          hover: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        hand: ['var(--font-hand)', 'cursive'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'title': ['1.5rem', { lineHeight: '1.25' }],
      },
      borderRadius: {
        'card': '0.75rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.12)',
        'offset': '3px 3px 0 #D5D0C8',
        'offset-lg': '4px 4px 0 #D5D0C8',
        'header': '0 1px 0 rgba(0,0,0,0.05)',
        'drop': '0 8px 24px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'fol-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'zip-glow': {
          '0%, 100%': { borderColor: '#D1D5E0', boxShadow: 'none' },
          '50%': { borderColor: '#C75B2A', boxShadow: '0 0 12px rgba(199,91,42,0.35)' },
        },
        'fol-pulse': {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1)', opacity: '0.05' },
          '50%': { transform: 'translate(-50%,-50%) scale(1.02)', opacity: '0.08' },
        },
        'fol-pulse-cta': {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: '0.06' },
          '50%': { transform: 'translate(-50%,-50%) scale(1.03) rotate(2deg)', opacity: '0.10' },
        },
        'lens-drift': {
          '0%': { transform: 'translate(0,0)', opacity: '0' },
          '15%': { opacity: '0.15' },
          '50%': { transform: 'translate(30px,-15px)', opacity: '0.08' },
          '85%': { opacity: '0.12' },
          '100%': { transform: 'translate(0,0)', opacity: '0' },
        },
      },
      animation: {
        'fol-spin': 'fol-spin 60s linear infinite',
        'zip-glow': 'zip-glow 2s ease-in-out infinite',
        'fol-pulse': 'fol-pulse 10s ease-in-out infinite',
        'fol-pulse-cta': 'fol-pulse-cta 8s ease-in-out infinite',
        'lens-drift': 'lens-drift 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
