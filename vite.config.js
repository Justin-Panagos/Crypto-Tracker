import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: './frontend', // Ensure Vite looks for index.html in the frontend/ directory
  plugins: [react()],
  build: {
    outDir: 'dist', // Output directory (relative to root)
  },
  // Disable caching for dev server (not build, but useful if testing locally)
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  }
})