/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 프로젝트 사이트 주소(https://hyeeun-hub.github.io/trip-ready/)에 맞춘 경로
  base: '/trip-ready/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
