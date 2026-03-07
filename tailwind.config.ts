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
          bg: '#F0EAE0',
          'bg-alt': '#E8DFCF',
          cream: '#F7F2EA',
          text: '#2d2d2d',
          accent: '#C75B2A',
          'accent-hover': '#B5481A',
          muted: '#6B6560',
          'muted-light': '#9B9590',
          border: '#D4CCBE',
          card: '#FFFFFF',
          success: '#2D8659',
          warning: '#C47D1A',
          danger: '#c43c4c',
          dark: '#2C2418',
          sand: '#D9CDB8',
          warm: '#C4B49A',
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
        'offset': '3px 3px 0 #2d2d2d',
        'offset-lg': '4px 4px 0 #2d2d2d',
        'header': '0 1px 0 rgba(0,0,0,0.05)',
        'drop': '0 8px 24px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'fol-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'zip-glow': {
          '0%, 100%': { borderColor: '#D4CCBE', boxShadow: 'none' },
          '50%': { borderColor: '#C75B2A', boxShadow: '0 0 12px rgba(199,91,42,0.35)' },
        },
      },
      animation: {
        'fol-spin': 'fol-spin 60s linear infinite',
        'zip-glow': 'zip-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
