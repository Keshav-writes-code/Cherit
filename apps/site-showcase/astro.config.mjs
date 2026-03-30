import svelte from '@astrojs/svelte';
import { defineConfig, fontProviders } from 'astro/config';
import UnoCSS from 'unocss/astro';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

import mdx from '@astrojs/mdx';

export default defineConfig({
  prefetch: true,
  integrations: [UnoCSS(), svelte(), sitemap(), robotsTxt(), mdx()],
  site: 'https://keshav.is-a.dev/',
  base: 'Cherit',
  devToolbar: {
    enabled: false,
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'DTNightingale',
      cssVariable: '--font-astro-dtnightingale',
      options: {
        variants: [
          {
            src: [
              '../../packages/shared-packages/fonts/DTNightingale-Light.woff2',
            ],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Recoleta',
      cssVariable: '--font-astro-recoleta',
      options: {
        variants: [
          {
            src: [
              './../../packages/shared-packages/fonts/Recoleta-RegularDEMO.woff2',
            ],
          },
        ],
      },
    },
    {
      name: 'Anonymous Pro',
      cssVariable: '--font-astro-anonymous-pro',
      weights: ['400'],
      provider: fontProviders.fontsource(),
    },
    {
      name: 'Xanh Mono',
      cssVariable: '--font-astro-xanh-mono',
      weights: ['400'],
      provider: fontProviders.fontsource(),
    },
    {
      name: 'Satoshi',
      cssVariable: '--font-astro-satoshi',
      provider: fontProviders.fontshare(),
    },
  ],
});
