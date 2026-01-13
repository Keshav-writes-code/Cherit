/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
const host = process.env.TAURI_DEV_HOST;
// https://vite.dev/config/
export default defineConfig({
  plugins: [UnoCSS(), svelte()],
  clearScreen: false,
  server: {
    host: host || false,
    port: 5173,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5173,
        }
      : undefined,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    cssMinify: 'lightningcss', // Enables advanced CSS minification
  },
  define: {
    __APP_NAME__: JSON.stringify(process.env.npm_package_name),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    include: ['./test'],
  },
});
