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
        ink:        '#0d1117',
        paper:      '#f4f5f7',
        white:      '#ffffff',
        dim:        '#5c6474',
        faint:      '#8a929e',
        rule:       '#dde1e8',
        blue:       '#1b5e8a',
        'blue-lt':  '#2a7db5',
        'blue-bg':  '#e8f2fa',
        teal:       '#7ec8e3',
        civic:      '#b03a2a',
        // Pathway colors — editorial dark palette
        health:     '#1a6b56',
        'health-lt':'#e4f2ed',
        'health-dk':'#0a2a22',
        families:   '#1e4d7a',
        hood:       '#4a2870',
        voice:      '#7a2018',
        money:      '#6a4e10',
        planet:     '#1a5030',
        bigger:     '#1a3460',
        // Center colors — badges
        learning:   '#2563eb',
        action:     '#dc2626',
        resource:   '#16a34a',
        accountability: '#9333ea',
        // Legacy aliases for components that still reference brand.*
        brand: {
          bg: '#ffffff',
          'bg-alt': '#f4f5f7',
          cream: '#ffffff',
          text: '#0d1117',
          accent: '#1b5e8a',
          'accent-hover': '#2a7db5',
          muted: '#5c6474',
          'muted-light': '#8a929e',
          border: '#dde1e8',
          card: '#ffffff',
          success: '#16a34a',
          warning: '#6a4e10',
          danger: '#b03a2a',
          dark: '#0d1117',
          sand: '#dde1e8',
          warm: '#8a929e',
        },
        // Legacy theme.* aliases — map to new pathway colors
        theme: {
          health:       '#1a6b56',
          families:     '#1e4d7a',
          neighborhood: '#4a2870',
          voice:        '#7a2018',
          money:        '#6a4e10',
          planet:       '#1a5030',
          bigger:       '#1a3460',
        },
        center: {
          community:    '#9333ea',
          learning:     '#2563eb',
          resource:     '#16a34a',
          action:       '#dc2626',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'Georgia', 'serif'],
        mono:    ['var(--font-mono)', 'monospace'],
        // Legacy aliases
        sans:    ['var(--font-body)', 'Georgia', 'serif'],
        serif:   ['var(--font-display)', 'Georgia', 'serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'title': ['1.5rem', { lineHeight: '1.25' }],
      },
      borderRadius: {
        'card': '0',
      },
      boxShadow: {
        'card': 'none',
        'card-hover': 'none',
        'offset': 'none',
        'offset-lg': 'none',
        'header': '0 1px 0 #dde1e8',
        'drop': 'none',
      },
      keyframes: {
        'fol-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'fol-pulse': {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1)', opacity: '0.05' },
          '50%': { transform: 'translate(-50%,-50%) scale(1.002)', opacity: '0.053' },
        },
        'fol-pulse-cta': {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: '0.06' },
          '50%': { transform: 'translate(-50%,-50%) scale(1.003) rotate(0.2deg)', opacity: '0.064' },
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
        'fol-pulse': 'fol-pulse 10s ease-in-out infinite',
        'fol-pulse-cta': 'fol-pulse-cta 8s ease-in-out infinite',
        'lens-drift': 'lens-drift 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
