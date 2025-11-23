<script lang="ts">
  import {
    build_file_tree_from_fs,
    sort_file_tree,
  } from "./file_tree_functions";
  import ItemsRender from "./items_renderer.svelte";
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
  let hover_newfile_button: boolean = $state(false);
</script>

<div class=" flex min-h-0 flex-1 flex-col w-full bg-base-200">
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
