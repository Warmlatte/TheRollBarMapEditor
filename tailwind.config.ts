import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'map-bg': '#1a1a1a',
        'border-muted': '#555',
        'accent-green': '#6a9a52',
        'accent-green-hover': '#5a8045',
        'accent-green-light': '#4a6e3a',
        'accent-red': '#8a3a2e',
        'accent-red-hover': '#a14538',
        'accent-red-border': '#c25a4a',
        'accent-blue': '#4a7a8a',
        'text-dim': '#ddd',
      },
    },
  },
  plugins: [],
} satisfies Config
