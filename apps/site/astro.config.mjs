import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";

import sitemap from "@astrojs/sitemap";

import robotsTxt from "astro-robots-txt";

export default defineConfig({
  integrations: [UnoCSS(), svelte(), sitemap(), robotsTxt()],
  site: "https://Keshav-writes-code.github.io",
  base: "cherit",
});
