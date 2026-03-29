import { presetDaisyui } from "@0x-jerry/unocss-preset-daisyui";
import { presetAnimations } from "unocss-preset-animations";
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
      "w-full flex flex-col justify-center items-center px-6 py-24 lt-md:py-15 relative overflow-hidden",
    "animate-on-scroll":
      "opacity-0 translate-y-10 transition-all duration-800 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    visible: "opacity-100 translate-y-0",
    "bento-card":
      "bg-base-200/50 backdrop-blur-md shadow-lg rounded-3xl p-8 hover:bg-base-200 transition-colors b-1 b-[color-mix(in_srgb,var(--color-base-content)_20%,black)] ",
    "text-gradient":
      "bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent",
    blob: "absolute bg-primary/20 rounded-full blur-3xl -z-10",
  },
  safelist: ["visible"],
  rules: [
    ["capitalize", { "text-transform": "capitalize" }],
    ["isolate", { isolation: "isolate" }],
  ],
  theme: {
    extend: {
      fontFamily: {
        dt123: ["var(--font-dtnightingale)"],
      },
    },
  },
  presets: [
    presetWind4({
      preflights: {
        reset: false,
      },
      dark: "media",
    }),
    presetAnimations(),
    presetIcons(),
    presetDaisyui(),
    presetTypography(),
    presetWebFonts({
      provider: "none",
      fonts: {
        sans: "var(--font-astro-satoshi)",
        recoleta: "var(--font-astro-recoleta)",
        nightingale: "var(--font-astro-dtnightingale)", //coming from Astro's Font config
        mono: "var(--font-astro-anonymous-pro)",
        mono2: "var(--font-astro-xanh-mono)",
      },
      processors: createLocalFontProcessor({
        cacheDir: "node_modules/.cache/unocss/fonts",
        fontAssetsDir: "public/assets/fonts",
        fontServeBaseUrl:
          import.meta.env.NODE_ENV == "development"
            ? "assets/fonts"
            : "/assets/fonts",
      }),
    }),
  ],
  transformers: [transformerVariantGroup()],
});
