import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' -> derlenen site herhangi bir alt dizinde (ör. GitHub Pages /Word-Archer/) çalışır.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 3000, open: true },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
})
