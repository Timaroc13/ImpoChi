// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const NOINDEX = ['/gracias', '/gracias-chico', '/muestras/'];

export default defineConfig({
  site: process.env.SITE_URL || 'https://dosdeltas.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.some((p) => new URL(page).pathname.startsWith(p)),
      i18n: { defaultLocale: 'es-AR', locales: { 'es-AR': 'es-AR' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
