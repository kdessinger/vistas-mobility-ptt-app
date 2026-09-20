import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Capacitor expects a relative base path so the app loads from the
// device's local filesystem (file://) rather than from a web root.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
})
