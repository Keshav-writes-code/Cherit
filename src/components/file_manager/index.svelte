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
  let focused_directory: string | undefined = $derived(root_path);
  $effect(() => {
    sort_file_tree(file_tree);
  });
  let collapsed_state: boolean = $state(true);
  $effect(() => {
    if (!root_path) return;
    build_file_tree_from_fs(root_path)
      .then((v) => (file_tree = v))
      .catch((e) => toast.error("Error loading file tree:" + e));
  });
  let left_x: number | undefined = $state(undefined);
  let is_resizing = $state(false);
  let hover_newfile_button: boolean = $state(false);
</script>

<svelte:window
  onmousemove={(e: MouseEvent) => {
    if (!is_resizing) return;
    left_x = e.clientX;
  }}
  onmouseup={() => (is_resizing = false)}
/>
<div
  style={left_x ? `width: ${left_x}px` : ""}
  class="
  {is_resizing && 'duration-0'}
  flex h-full min-w-[200px] b-r-1 b-r-[color-mix(in_srgb,var(--color-base-content)_22%,black)] max-w-[600px] flex-col w-80 bg-base-200"
>
  <div
    role="presentation"
    aria-hidden="true"
    onmousedown={() => (is_resizing = true)}
    ondblclick={() => (left_x = undefined)}
    class={`absolute h-full w-0.8 hover:bg-primary ${is_resizing && "bg-primary"} transition-all duration-300 cursor-row-resize right-0 z-1`}
  ></div>
  <div
    class="w-full h-10 bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
    data-tauri-drag-region
  ></div>
  <Toolbar
    bind:collapsed_state
    bind:opened_filenode
    bind:hover_newfile_button
    {focused_directory}
    {root_path}
    bind:file_tree
  />
  <ItemsRender
    bind:opened_filenode
    bind:focused_directory
    {hover_newfile_button}
    {collapsed_state}
    {file_tree}
    {root_path}
  />
</div>
