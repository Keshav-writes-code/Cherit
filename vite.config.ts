import { defineConfig } from "vite";
import UnoCSS from "unocss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [UnoCSS(), svelte()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_NAME__: JSON.stringify(process.env.npm_package_name),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
