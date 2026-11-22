/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Always 5173: the API only accepts requests from this address (CLIENT_ORIGIN in server/.env).
  // strictPort stops with "Port 5173 is already in use" instead of quietly moving to 5174,
  // where the page would load but logging in would fail.
  server: {
    port: 5173,
    strictPort: true,
  },
  // Component tests (npm test): run in jsdom, a fake browser page inside Node
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
