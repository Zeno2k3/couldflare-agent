
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom', // Giả lập trình duyệt
    globals: true,
    setupFiles: './src/setupTests.ts', // File cài đặt môi trường
  },
})
