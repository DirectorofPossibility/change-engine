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
        /* ── Locked editorial palette ── */
        ink:        '#1A1A1A',
        paper:      '#F8F4EC',
        parchment:  '#F5F0E8',
        'parchment-warm': '#EDE7D8',
        white:      '#ffffff',
        clay:       '#C4663A',
        muted:      '#7a7265',
        dim:        '#7a7265',       // alias → muted (backwards compat)
        faint:      '#9a9189',
        rule:       'rgba(196,102,58,0.3)',
        blue:       '#1a3460',
        'blue-lt':  '#2a5580',
        'blue-bg':  '#f0ece4',
        teal:       '#7ec8e3',
        civic:      '#C4663A',       // alias → clay
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
        // Dashboard sidebar
        sidebar: {
          bg: '#1A1A1A',
          hover: '#2a2a2a',
          active: '#333333',
        },
        // Legacy aliases — updated to editorial palette
        brand: {
          bg: '#ffffff',
          'bg-alt': '#F8F4EC',
          cream: '#ffffff',
          text: '#1A1A1A',
          accent: '#C4663A',
          'accent-hover': '#b55a33',
          muted: '#7a7265',
          'muted-light': '#9a9189',
          border: 'rgba(196,102,58,0.3)',
          card: '#ffffff',
          success: '#16a34a',
          warning: '#6a4e10',
          danger: '#b03a2a',
          dark: '#1A1A1A',
          sand: 'rgba(196,102,58,0.3)',
          warm: '#9a9189',
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
        display: ['Georgia', '"Times New Roman"', 'serif'],
        body:    ['Georgia', '"Times New Roman"', 'serif'],
        mono:    ['"Courier New"', 'Courier', 'monospace'],
        sans:    ['Georgia', '"Times New Roman"', 'serif'],
        serif:   ['Georgia', '"Times New Roman"', 'serif'],
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
        'header': '0 1px 0 rgba(196,102,58,0.3)',
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
