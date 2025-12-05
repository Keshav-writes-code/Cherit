<script lang="ts">
  import {
    build_file_tree_from_fs,
    move_node,
    sort_file_tree,
  } from '@/lib/file_tree_functions';
  import ItemsRender from './items_renderer.svelte';
  import { type FileNode, type RootPath } from '@/types';
  import Toolbar from './toolbar.svelte';
  import { toast } from 'svelte-sonner';
  let {
    opened_filenode = $bindable(),
    root_path = $bindable(),
  }: {
    opened_filenode: FileNode | undefined;
    root_path: RootPath;
  } = $props();

  let file_tree: FileNode[] = $state([]);
  let prev_root_folder: RootPath = $state();
  let focused_directory: RootPath = $derived(root_path);
  $effect(() => {
    sort_file_tree(file_tree);
  });
  let collapsed_state: boolean = $state(true);
  $effect(() => {
    if (!root_path) return;
    build_file_tree_from_fs(root_path)
      .then((v) => {
        file_tree = v;
        prev_root_folder = root_path;
      })
      .catch((e) => {
        toast.error('Error loading file tree: \n' + e);
        console.error(e);
        root_path = prev_root_folder;
      });
  });
  let hover_newnode_button: boolean = $state(false);
</script>

<div class=" flex min-h-0 flex-1 flex-col w-full bg-base-200">
  <Toolbar
    bind:collapsed_state
    bind:opened_filenode
    bind:hover_newnode_button
    {focused_directory}
    {root_path}
    bind:file_tree
  />
  <ItemsRender
    bind:opened_filenode
    bind:focused_directory
    {hover_newnode_button}
    {collapsed_state}
    {file_tree}
    {root_path}
    on_move={async (node, path) => {
      try {
        await move_node(node, path, file_tree);
      } catch (e) {
        toast.error('Error Moving File: \n' + e);
        console.error(e);
      }
    }}
  />
</div>
