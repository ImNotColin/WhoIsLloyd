// tailwind.config.js — the design system, such as it is. Same hex values as
// the :root variables in index.css; if the two ever disagree, the site will
// look subtly wrong and nobody will be able to say why.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // The palette has names, not numbers, because "bg-ink text-bone" reads
      // like a sentence and "bg-[#0A0A0A]" reads like a license plate.
      colors: {
        ink: '#0A0A0A', // near-black page background — true #000 is for amateurs
        surface: '#111111', // cards and panels, one stop above ink
        line: '#1E1E1E', // borders and dividers
        gold: '#C9A84C', // the brand. Used sparingly, which is why it works
        'gold-dim': '#8A6F2E', // gold for supporting roles and hover states
        bone: '#F0EDE8', // body text — warm off-white, easy at night
        muted: '#6B6B6B', // secondary text, captions, the fine print
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'], // tall condensed caps for headlines
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'], // labels and kickers — anything that should read like telemetry
      },
      // Two custom tracking stops: cinematic for big display type, wide2 for
      // the small uppercase mono labels that need air between the letters.
      letterSpacing: {
        cinematic: '0.08em',
        wide2: '0.2em',
      },
    },
  },
  plugins: [],
};
