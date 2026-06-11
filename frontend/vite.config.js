// vite.config.js — build and dev-server config. Short on purpose; every line
// added here is a line someone will have to explain in two years.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev, /api and /storage forward to the Express server on :3001 —
    // same-origin from the browser's point of view, so no CORS paperwork.
    // In production nginx runs this tower instead.
    proxy: {
      '/api': 'http://localhost:3001',
      '/storage': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    // No production sourcemaps: the bundle flies lighter, and nobody needs
    // a public map of the cockpit.
    sourcemap: false,
  },
});
