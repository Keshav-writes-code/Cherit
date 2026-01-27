<script lang="ts">
  import { move_node } from '@/lib/file_system';
  import ItemsRender from './items_renderer.svelte';
  import Toolbar from './toolbar.svelte';
  import { toast } from 'svelte-sonner';
  import { workspace_root_path } from '@/lib/global_states/index.svelte';
  import { file_tree } from './states.svelte';
  let focused_directory_path: string | undefined = $derived(
    workspace_root_path.data?.path
  );
</script>

<div class=" flex min-h-0 flex-1 flex-col w-full bg-base-200">
  <Toolbar {focused_directory_path} />
  <ItemsRender
    bind:focused_directory_path
    on_move={async (node, path) => {
      if (file_tree.data === undefined) return;
      try {
        await move_node(
          node,
          path,
          file_tree.data,
          workspace_root_path.data?.document_top_tree_uri ?? null
        );
      } catch (e) {
        toast.error('Error Moving File: \n' + e);
        console.error(e);
      }
    }}
  />
</div>
