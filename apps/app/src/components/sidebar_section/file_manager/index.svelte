<script lang="ts">
  import { move_node } from '@/lib/file_system';
  import ItemsRender from './items_renderer.svelte';
  import Toolbar from './toolbar.svelte';
  import { toast } from 'svelte-sonner';
  import { file_tree, root_path } from '@/lib/states';

  let focused_directory: string | undefined = $derived(root_path.data?.path);

  let collapsed_state: boolean = $state(true);
  let hover_newnode_button: boolean = $state(false);
</script>

<div class=" flex min-h-0 flex-1 flex-col w-full bg-base-200">
  <Toolbar bind:collapsed_state bind:hover_newnode_button {focused_directory} />
  <ItemsRender
    bind:focused_directory
    {hover_newnode_button}
    {collapsed_state}
    on_move={async (node, path) => {
      if (file_tree.data === undefined) return;
      try {
        await move_node(
          node,
          path,
          file_tree.data,
          root_path.data?.document_top_tree_uri ?? null
        );
      } catch (e) {
        toast.error('Error Moving File: \n' + e);
        console.error(e);
      }
    }}
  />
</div>
