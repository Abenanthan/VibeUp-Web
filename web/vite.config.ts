import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/audio-proxy-aac': {
        target: 'https://aac.saavncdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-proxy-aac/, ''),
      },
      '/audio-proxy-h': {
        target: 'https://h.saavncdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-proxy-h/, ''),
      },
      '/audio-proxy-c': {
        target: 'https://c.saavncdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-proxy-c/, ''),
      }
    }
  }
})
