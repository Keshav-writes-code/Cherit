<script lang="ts">
  import {
    build_file_tree_from_fs,
    sort_file_tree,
  } from "./file_tree_functions";
  import ItemsRender from "@/components/file_manager/items_renderer.svelte";
  import { type FileNode } from "@/types";
  import Toolbar from "./toolbar.svelte";
  import { toast } from "svelte-sonner";
  let {
    opened_filenode = $bindable(),
    root_path,
  }: { opened_filenode: FileNode | undefined; root_path: string | undefined } =
    $props();

  let file_tree: FileNode[] = $state([]);
  let file_tree_sorted: FileNode[] = $derived.by(() => {
    return sort_file_tree(file_tree);
  });
  let collapsed_state: boolean = $state(true);
  $effect(() => {
    if (!root_path) return;
    build_file_tree_from_fs(root_path)
      .then((v) => (file_tree = v))
      .catch((e) => toast.error("Error loading file tree:" + e));
  });
</script>

<div class="flex h-full flex-col w-80 bg-base-200">
  <div
    class="w-full h-10 bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
    data-tauri-drag-region
  ></div>
  <Toolbar bind:collapsed_state {root_path} bind:file_tree />
  <ItemsRender
    bind:opened_filenode
    {collapsed_state}
    file_tree={file_tree_sorted}
    {root_path}
  />
</div>
