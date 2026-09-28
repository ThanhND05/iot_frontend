import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  // sockjs-client references Node.js `global` — polyfill it for the browser.
  define: {
    global: 'globalThis',
  },
})
