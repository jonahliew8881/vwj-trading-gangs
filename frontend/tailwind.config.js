/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        josefin: ['Josefin Sans', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      colors: {
        cy: {
          bg: '#080c10',
          panel: '#0d1117',
          border: '#1a2a3a',
          accent: '#00d4ff',
          accent2: '#ff6b35',
          green: '#00ff88',
          red: '#ff3355',
          yellow: '#ffd700',
          text: '#c8d8e8',
          muted: '#4a6a8a',
          grid: '#0a1520',
        }
      }
    }
  },
  plugins: []
}