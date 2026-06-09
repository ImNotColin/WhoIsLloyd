/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        surface: '#111111',
        line: '#1E1E1E',
        gold: '#C9A84C',
        'gold-dim': '#8A6F2E',
        bone: '#F0EDE8',
        muted: '#6B6B6B',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        cinematic: '0.08em',
        wide2: '0.2em',
      },
    },
  },
  plugins: [],
};
