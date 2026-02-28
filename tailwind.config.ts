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
          bg: '#F5F1EB',
          text: '#2C2C2C',
          accent: '#C75B2A',
          muted: '#8B7E74',
          border: '#E8E3DB',
          card: '#FFFFFF',
          success: '#38a169',
          warning: '#d69e2e',
          danger: '#e53e3e',
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
        sidebar: {
          bg: '#2C2C2C',
          hover: '#3a3a3a',
          active: '#C75B2A',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
