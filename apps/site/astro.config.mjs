import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";
import svelte from "@astrojs/svelte";

export default defineConfig({
  integrations: [UnoCSS(), svelte()],
  site: "https://Keshav-writes-code.github.io",
  base: "cherit",
});
