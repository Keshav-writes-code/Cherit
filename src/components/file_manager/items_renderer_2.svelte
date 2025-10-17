<script lang="ts">
  import type { FileNode } from "./build_file_tree";
  import ItemsRender2 from "./items_renderer_2.svelte";

  let { file_tree }: { file_tree: FileNode[] } = $props();
</script>

<ul>
  {#each file_tree as node}
    {#if node.isDirectory}
      <li>
        <details open>
          <summary> {node.name} </summary>
          <ItemsRender2 file_tree={node.children} />
        </details>
      </li>
    {:else}
      <li>
        <a href="">{node.name} </a>
      </li>
    {/if}
  {/each}
</ul>
