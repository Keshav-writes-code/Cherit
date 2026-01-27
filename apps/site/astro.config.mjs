import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";

import sitemap from "@astrojs/sitemap";

import robotsTxt from "astro-robots-txt";
import starlight from "@astrojs/starlight";
import starlightSidebarTopics from "starlight-sidebar-topics";

import mdx from "@astrojs/mdx";

export default defineConfig({
  integrations: [
    UnoCSS(),
    svelte(),
    sitemap(),
    robotsTxt(),
    starlight({
      title: "Cherit",
      plugins: [
        starlightSidebarTopics([
          {
            id: "dev-docs",
            label: "Dev Docs",
            link: "docs/get-started",
            icon: "laptop",
            items: [
              {
                label: "Development",
                autogenerate: { directory: "docs/dev_docs" },
              },
            ],
          },
          {
            label: "Guides",
            link: "docs/guides/how_to_setup_syncing",
            icon: "rocket",
            items: ["docs/guides/how_to_setup_syncing"],
          },
        ]),
      ],
    }),
    mdx(),
  ],
  site: "https://keshav.is-a.dev/",
  base: "Cherit",
  devToolbar: {
    enabled: false,
  },
});
