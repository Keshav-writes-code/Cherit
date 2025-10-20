<script lang="ts">
  import { build_file_tree } from "./build_file_tree";
  import ItemsRender from "@/components/file_manager/items_renderer.svelte";
  import { type FileNode } from "@/types";

  let file_tree: FileNode[] = $state([]);

  let {
    opened_filenode = $bindable(),
    root_path,
  }: { opened_filenode: FileNode | undefined; root_path: string | undefined } =
    $props();

  async function load_tree(rootPath: string): Promise<void> {
    try {
      file_tree = await build_file_tree(rootPath);
    } catch (error) {
      console.error("Error loading file tree:", error);
      // Handle error in UI, e.g., show a message
    }
  }
  $effect(() => {
    if (!root_path) return;
    load_tree(root_path);
  });
  $inspect(file_tree);
</script>

<div class="flex h-full flex-col w-80">
  <div
    class="w-full h-10 bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
    data-tauri-drag-region
  ></div>
  <ItemsRender bind:opened_filenode {file_tree} {root_path} />
</div>
