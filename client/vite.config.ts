/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: false, // Reverted to original 'false' as 'REDIS_TLS=false' is not valid JS syntax here.
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress noise from aborted connections during development
            if (err.message.includes('ECONNABORTED')) return;
            console.error('Vite Proxy Error:', err.message);
          });
        }
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
