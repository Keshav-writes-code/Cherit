<script lang="ts">
  import BreadCrumb from "@/components/breadcrumb_path/index.svelte";
  import {
    readTextFile,
    BaseDirectory,
    writeTextFile,
  } from "@tauri-apps/plugin-fs";
  import type { FileNode } from "@/types";
  import Prosemark from "./prosemark.svelte";
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
  <div class="max-w-170 w-full font-sans">
    <h2 class="w-full mb-16 mt-10 font-semibold text-5xl">
      {filenode?.name}
    </h2>
    <Prosemark
      {text_content}
      write_to_file={(content) => {
        if (!filenode) return;
        writeTextFile(filenode?.path, content);
      }}
    />
  </div>
</div>
