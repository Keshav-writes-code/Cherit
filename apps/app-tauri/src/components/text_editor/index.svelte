<script lang="ts">
  import BreadCrumb from "@/components/breadcrumb_path/index.svelte";
  import { readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
  import type { FileNode } from "@/types";
  import Prosemark from "./prosemark.svelte";
  import { toast } from "svelte-sonner";
  let {
    filenode = $bindable(),
    root_path,
  }: { filenode: FileNode | undefined; root_path: string | undefined } =
    $props();
  let text_content: string | undefined = $state();
  let current_file_name: string | undefined = $state();
  let is_file_named_changed: boolean = $state(false);

  $effect(() => {
    if (!filenode) return;
    readTextFile(filenode.path)
      .then((res) => {
        text_content = res || "\n";
        current_file_name = filenode?.name;
      })
      .catch((err) => {
        toast.error(err);
        filenode = undefined;
        text_content = undefined;
        current_file_name = undefined;
      });
  });
</script>

<BreadCrumb {filenode} {root_path} />
<div class="w-full px-8 flex justify-center flex-1 overflow-auto">
  <div class="max-w-170 w-full font-sans">
    <input
      type="text"
      oninput={(e) => {
        current_file_name = current_file_name?.replace(
          /[^A-Za-z0-9 _.\-()]/g,
          "",
        );
        is_file_named_changed = current_file_name != filenode?.name;
      }}
      onfocusout={async () => {
        if (!is_file_named_changed) return;
        if (!current_file_name || !filenode) return;
        const new_file_path =
          filenode.path.replace(/[^/\\]+$/, current_file_name) + ".md";
        try {
          await rename(filenode.path, new_file_path);
          filenode.path = new_file_path;
          filenode.name = current_file_name;
          is_file_named_changed = false;
        } catch (e) {
          if (e instanceof Error) toast.error(e.message);
        }
      }}
      bind:value={current_file_name}
      class="w-full outline-none b-0 focus:ring-0 mb-16 mt-10 font-semibold text-5xl"
    />

    <Prosemark
      {text_content}
      write_to_file={(content) => {
        if (!filenode) return;
        writeTextFile(filenode?.path, content);
      }}
    />
  </div>
</div>
