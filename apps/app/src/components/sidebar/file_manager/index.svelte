<script lang="ts">
  import { build_file_tree_from_fs, move_node } from '@/lib/file_tree';
  import ItemsRender from './items_renderer.svelte';
  import { type GenericPath } from '@/types';
  import Toolbar from './toolbar.svelte';
  import { toast } from 'svelte-sonner';
  import { file_tree, root_path } from '@/lib/states/ui_states.svelte';

  let prev_root_folder: GenericPath | undefined = $state();
  let focused_directory: string | undefined = $derived(root_path.data?.path);
  let is_filetree_loading: boolean = $state(false);

  let collapsed_state: boolean = $state(true);
  $effect(() => {
    if (!root_path.data) return;
    is_filetree_loading = true;
    build_file_tree_from_fs(root_path.data)
      .then((v) => {
        file_tree.data = v;
        prev_root_folder = root_path.data;
        is_filetree_loading = false;
      })
      .catch((e) => {
        toast.error('Error loading file tree: \n' + e);
        console.error(e);
        root_path.data = prev_root_folder;
        is_filetree_loading = false;
      });
  });
  let hover_newnode_button: boolean = $state(false);
</script>

<div class=" flex min-h-0 flex-1 flex-col w-full bg-base-200">
  <Toolbar bind:collapsed_state bind:hover_newnode_button {focused_directory} />
  <ItemsRender
    bind:focused_directory
    {hover_newnode_button}
    {collapsed_state}
    {is_filetree_loading}
    on_move={async (node, path) => {
      if (file_tree.data === undefined) return;
      try {
        await move_node(node, path, file_tree.data);
      } catch (e) {
        toast.error('Error Moving File: \n' + e);
        console.error(e);
      }
    }}
  />
</div>
