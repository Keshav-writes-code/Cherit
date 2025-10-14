import { defineConfig } from "unocss";
import { transformerVariantGroup } from "unocss";
import { presetIcons } from "unocss";
import { presetMini } from "unocss";
import { presetDaisyui } from "@0x-jerry/unocss-preset-daisyui";
export default defineConfig({
  rules: [
    ["capitalize", { "text-transform": "capitalize" }],
    ["isolate", { isolation: "isolate" }],
  ],
  presets: [presetMini(), presetIcons(), presetDaisyui()],
  transformers: [transformerVariantGroup()],
  separators: [":"],
});
