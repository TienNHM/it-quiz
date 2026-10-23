import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'IT Quiz',
        short_name: 'IT Quiz',
        description: 'Ôn tập kiến thức IT và luyện phỏng vấn bằng quiz, chạy offline.',
        lang: 'vi',
        display: 'standalone',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        start_url: './',
        scope: './',
        icons: [
          {src: 'pwa-192.png', sizes: '192x192', type: 'image/png'},
          {src: 'pwa-512.png', sizes: '512x512', type: 'image/png'},
          {src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,png,woff2,woff}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {chunkSizeWarningLimit: 1500},
  test: {environment: 'jsdom'},
} as Parameters<typeof defineConfig>[0]);
