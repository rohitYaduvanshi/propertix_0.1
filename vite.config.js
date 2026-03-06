import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['leaflet']  // ✅ Leaflet fix for blank map
  },
  define: {
    global: 'globalThis',  // ✅ Leaflet global fix
  },
})
