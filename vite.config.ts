/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // `import Logo from './logo.svg?react'` inlines the SVG as a React component.
    // Used for Figma assets with SVG filters (inner shadows): Safari rasterises
    // filtered SVGs loaded via <img> at low resolution, so they look pixelated
    // on Retina screens. Inline SVG renders crisp.
    svgr({
      svgrOptions: {
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        svgoConfig: {
          // 1. Make ids unique per file (several inlined SVGs share Figma ids
          //    like "filter0_ii_0_64").
          // 2. Drop Figma's root style="display:block", which would override
          //    Tailwind's hidden/dark:hidden classes.
          // No other optimisation: the artwork stays exactly as exported.
          plugins: [
            'prefixIds',
            { name: 'removeAttributesBySelector', params: { selector: 'svg', attributes: ['style'] } },
          ],
        },
      },
    }),
  ],
  build: {
    // Keep output Safari-compatible (Safari 14+ / iOS 14+).
    target: ['es2020', 'safari14'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
