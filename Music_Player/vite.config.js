import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  },
  build: {
    chunkSizeWarningLimit: 300,
    esbuild: {
      drop: ['console', 'debugger']
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/gsap')) {
            return 'gsap-vendor'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor'
          }
          return undefined
        }
      }
    }
  }
})
