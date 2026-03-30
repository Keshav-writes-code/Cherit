import { defineConfig, fontProviders } from 'astro/config';
import mermaid from 'astro-mermaid';

import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';

import mdx from '@astrojs/mdx';

export default defineConfig({
  prefetch: true,
  integrations: [
    sitemap(),
    robotsTxt(),
    mermaid(),
    starlight({
      title: 'Cherit',
      plugins: [
        starlightSidebarTopics([
          {
            id: 'dev-docs',
            label: 'Dev Docs',
            link: 'get-started',
            icon: 'laptop',
            items: [
              {
                label: 'Development',
                autogenerate: { directory: 'dev_docs' },
              },
            ],
          },
          {
            label: 'Guides',
            link: 'guides/how_to_setup_syncing',
            icon: 'rocket',
            items: ['guides/how_to_setup_syncing'],
          },
        ]),
      ],
      logo: {
        src: '../../packages/shared-packages/images/logo_500.png',
      },
      components: {
        Head: './src/components/head.astro',
        SiteTitle: './src/components/navbar_title.astro',
      },
      customCss: ['./src/styles/custom.css'],
    }),
    mdx(),
  ],
  site: 'https://keshav.is-a.dev/',
  base: 'Cherit/docs/',
  devToolbar: {
    enabled: false,
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Recoleta',
      cssVariable: '--font-astro-recoleta',
      options: {
        variants: [
          {
            src: [
              '../../packages/shared-packages/fonts/Recoleta-RegularDEMO.otf ',
            ],
          },
        ],
      },
    },
    {
      name: 'Inter',
      cssVariable: '--font-astro-inter',
      provider: fontProviders.fontsource(),
    },
  ],
});
