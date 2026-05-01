import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client references Node.js `global` — this polyfills it for browsers
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
})
