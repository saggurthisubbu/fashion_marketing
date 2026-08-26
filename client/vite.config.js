import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'icons/*.png',
        'placeholder-product.svg',
        'placeholder-product.jpg',
      ],
      manifest: {
        name: 'QuickFit - Fashion in 1 Hour',
        short_name: 'QuickFit',
        description: 'Order luxury fashion from top Vijayawada boutiques. Express delivery to your doorstep within 60 minutes.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#000000',
        background_color: '#ffffff',
        scope: '/',
        lang: 'en',
        categories: ['shopping', 'lifestyle', 'fashion'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'QuickFit Home Screen',
          },
        ],
      },
      workbox: {
        // Cache strategies
        runtimeCaching: [
          // Categories API — NetworkFirst with very short cache TTL so admin edits show immediately
          {
            urlPattern: /\/api\/admin\/categories/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'quickfit-categories-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60, // 1 minute max — stale categories should NEVER persist
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5, // Fall back to cache quickly if network is slow
            },
          },
          // All other API calls — Network First (fresh data preferred, fall back to cache)
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'quickfit-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          // Product images / uploads — Cache First (images don't change often)
          {
            urlPattern: /^https?:\/\/.*\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quickfit-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts — StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'quickfit-google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quickfit-google-fonts-files',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Pre-cache all build assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Skip waiting so updates apply immediately
        skipWaiting: true,
        clientsClaim: true,
        // Navigate to index.html for all SPA routes
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
      },
      devOptions: {
        // Enable PWA in dev for easier debugging (optional)
        enabled: false,
        type: 'module',
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true, // Listen on 0.0.0.0 for mobile / LAN testing
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
