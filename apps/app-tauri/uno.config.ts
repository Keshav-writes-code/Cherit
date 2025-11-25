import { defineConfig } from "unocss";
import { transformerVariantGroup } from "unocss";
import { presetIcons } from "unocss";
import { presetMini } from "unocss";
import { presetDaisyui } from "@0x-jerry/unocss-preset-daisyui";
import { presetTypography } from "unocss";
export default defineConfig({
  rules: [
    ["capitalize", { "text-transform": "capitalize" }],
    ["isolate", { isolation: "isolate" }],
  ],
  presets: [
    presetMini(),
    presetIcons(),
    presetDaisyui(),
    presetTypography({
      cssExtend: {
        h2: { "margin-top": "2rem", "margin-bottom": "0.5rem" },
        h3: { "margin-top": "1rem", "margin-bottom": "0.5rem" },
        li: { "margin-top": 0, "margin-bottom": 0 },
        p: { "margin-top": 0, "margin-bottom": 0 },
        ul: { "margin-top": 0, "margin-bottom": 0 },
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
  separators: [":"],
});
