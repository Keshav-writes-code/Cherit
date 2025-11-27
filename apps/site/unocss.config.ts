// uno.config.ts

import { presetDaisyui } from "@0x-jerry/unocss-preset-daisyui";
import { createLocalFontProcessor } from "@unocss/preset-web-fonts/local";
import {
  defineConfig,
  presetIcons,
  presetWebFonts,
  transformerVariantGroup,
  presetTypography,
  presetWind4,
} from "unocss";

export default defineConfig({
  shortcuts: {
    "section-container":
      "flex flex-col justify-center items-center px-6 py-24 relative overflow-hidden",
    "animate-on-scroll":
      "opacity-0 translate-y-10 transition-all duration-1000 ease-out",
    visible: "opacity-100 translate-y-0",
    "bento-card":
      "bg-base-200/50 backdrop-blur-md shadow-lg rounded-3xl p-8 hover:bg-base-200 transition-colors b-1 b-[color-mix(in_srgb,var(--color-base-content)_20%,black)] ",
    "text-gradient":
      "bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent",
    blob: "absolute bg-primary/20 rounded-full blur-3xl -z-10",
  },
  rules: [
    ["capitalize", { "text-transform": "capitalize" }],
    ["isolate", { isolation: "isolate" }],
  ],
  presets: [
    presetWind4({
      preflights: {
        reset: false,
      },
    }),
    presetIcons(),
    presetDaisyui(),
    presetTypography(),
    presetWebFonts({
      provider: "bunny",
      fonts: {
        sans: "Atkinson Hyperlegible",
        sans2: "Alata",
        mono: "Fira Code",
      },
      processors: createLocalFontProcessor({
        cacheDir: "node_modules/.cache/unocss/fonts",
        fontAssetsDir: "public/assets/fonts",
        fontServeBaseUrl: "/cherit/assets/fonts",
      }),
    }),
  ],
  transformers: [transformerVariantGroup()],
});
