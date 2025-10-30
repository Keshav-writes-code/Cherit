<script lang="ts">
  import BreadCrumb from "@/components/breadcrumb_path/index.svelte";
  import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
  import type { FileNode } from "@/types";
  import TipTap from "@/components/text_editor/tiptap.svelte";
  let {
    filenode,
    root_path,
  }: { filenode: FileNode | undefined; root_path: string | undefined } =
    $props();
  let text_content: string | undefined = $state();

  $effect(async () => {
    if (!filenode) return;
    text_content = await readTextFile(filenode.path);
  });
</script>

<BreadCrumb {filenode} {root_path} />
<div class="w-full px-8 flex justify-center flex-1 overflow-auto">
  <div class="max-w-170 w-full prose-2xl prose-blue prose prose-invert">
    <h2 class="w-full mb-16 mt-10">{filenode?.name}</h2>
    <TipTap {text_content} />
  </div>
</div>
