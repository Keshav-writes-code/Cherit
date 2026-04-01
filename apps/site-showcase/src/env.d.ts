/// <reference path="../.astro/types.d.ts" />
interface ImportMetaEnv {
  readonly GH_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
