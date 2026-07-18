import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Direct JioSaavn API proxy — lets the browser call api.php without CORS
      '/jiosaavn-search': {
        target: 'https://www.jiosaavn.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/jiosaavn-search/, '/api.php'),
      },
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
