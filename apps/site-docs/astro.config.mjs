import { defineConfig, fontProviders } from 'astro/config';
import mermaid from 'astro-mermaid';

import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';

import mdx from '@astrojs/mdx';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  prefetch: true,
  integrations: [
    sitemap(),
    robotsTxt(),
    mermaid({
      iconPacks: [
        {
          name: 'logos',
          loader: () =>
            fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then(
              (res) => res.json()
            ),
        },
        {
          name: 'iconoir',
          loader: () =>
            fetch('https://unpkg.com/@iconify-json/iconoir@1/icons.json').then(
              (res) => res.json()
            ),
        },
      ],
    }),
    starlight({
      title: 'Cherit',
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css',
          },
        },
      ],
      plugins: [
        starlightSidebarTopics([
          {
            id: 'dev-docs',
            label: 'Dev Docs',
            link: 'get-started',
            icon: 'laptop',
            items: [
              {
                label: 'Get Started',
                autogenerate: { directory: 'dev_docs/get_started' },
              },
              {
                label: 'Core Concepts',
                autogenerate: { directory: 'dev_docs/core_concepts' },
              },
              {
                label: 'Guides',
                autogenerate: { directory: 'dev_docs/guides' },
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
              '../../packages/shared-packages/fonts/Recoleta-RegularDEMO.woff2 ',
            ],
          },
        ],
      },
    },
    {
      name: 'Satoshi',
      cssVariable: '--font-astro-satoshi',
      provider: fontProviders.fontshare(),
      weights: [500],
    },
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
