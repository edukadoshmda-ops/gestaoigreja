import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

/** Alerta se Supabase não estiver configurado no build. */
function envCheck(mode: string) {
  return {
    name: 'env-check',
    buildStart() {
      const env = loadEnv(mode, process.cwd(), '');
      const url = env.VITE_SUPABASE_URL || '';
      const key = env.VITE_SUPABASE_ANON_KEY || '';
      const ok = url && key && !url.includes('placeholder') && key !== 'placeholder-key';
      const message = '\n⚠️  Supabase não configurado: faltam VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY.';
      if (!ok) {
        if (mode === 'production') {
          this.error(
            `${message} Defina as variáveis de ambiente antes do build (Vercel/Netlify/CI).`
          );
        }
        console.warn(message);
        console.warn('   Local: configure .env.local e reinicie npm run dev.');
        console.warn('   Vercel: Settings > Environment Variables.\n');
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 3000,
    strictPort: false,
    open: true,
  },
  base: '/',
  plugins: [
    envCheck(mode),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      devOptions: {
        enabled: true,
      },
      includeAssets: ['pwa-icon-192.png', 'pwa-icon-256.png', 'pwa-icon-512.png', 'favicon.ico', 'robots.txt'],
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias em cache local (poupa Egress do Supabase)
              }
            }
          },
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      buffer: 'buffer',
      stream: 'stream-browserify',
    },
    // Evita "Cannot read properties of null (reading 'useState')" com react-leaflet
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['buffer'],
    exclude: ['xlsx-js-style'],
  },
}));
