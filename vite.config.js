import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'frontend/', // Ensure Vite looks for index.html in the frontend/ directory
  plugins: [react()],
  build: {
    outDir: 'dist', // Output directory (relative to root)
  },
})