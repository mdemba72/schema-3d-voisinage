/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Chemin de publication : « / » en local, « /<nom-du-depot>/ » sur GitHub Pages.
const base = process.env.VITE_BASE ?? '/'

// Rapport de bundle (npm run build:rapport, mode « rapport ») : shots/8-bundle.html et
// shots/8-bundle.json, hors de dist.
export default defineConfig(({ mode }) => {
  const rapport = mode === 'rapport'
  return {
    base,
    plugins: [
      react(),
      rapport &&
        visualizer({ filename: 'shots/8-bundle.html', gzipSize: true, template: 'treemap' }),
      rapport &&
        visualizer({ filename: 'shots/8-bundle.json', gzipSize: true, template: 'raw-data' }),
      VitePWA({
        registerType: 'autoUpdate',
        // Enregistrement du service worker sans bloquer l'affichage.
        injectRegister: 'script-defer',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Schéma 3D — maison et terrain voisin',
          short_name: 'Schéma 3D',
          description: 'Schéma explicatif, non à l’échelle.',
          lang: 'fr',
          theme_color: '#EDF1F0',
          background_color: '#EDF1F0',
          display: 'standalone',
          orientation: 'any',
          start_url: '.',
          scope: '.',
          icons: [
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2,jpg,png}'],
        },
      }),
    ],
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  }
})
