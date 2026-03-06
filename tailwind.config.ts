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
          'bg-alt': '#F0ECE6',
          text: '#1A1A1A',
          accent: '#C75B2A',
          'accent-hover': '#B5481A',
          muted: '#6B6560',
          'muted-light': '#9B9590',
          border: '#E2DDD5',
          card: '#FFFFFF',
          success: '#2D8659',
          warning: '#C47D1A',
          danger: '#C53030',
          dark: '#2C2418',
        },
        theme: {
          health: '#DC4444',
          families: '#D97315',
          neighborhood: '#CA9B1D',
          voice: '#2D8659',
          money: '#2B6CB0',
          planet: '#278585',
          bigger: '#7C3AED',
        },
        sidebar: {
          bg: '#2C2418',
          hover: '#3D3428',
          active: '#C75B2A',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
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
        'card-hover': '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
        'header': '0 1px 0 rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
export default config
