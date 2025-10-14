<script lang="ts">
  import type { FileNode } from "./build_file_tree";

  let { file_tree }: { file_tree: FileNode[] } = $props();
</script>

<ul>
  {#each file_tree as node}
    {#if node.isDirectory}
      <li>
        <details open>
          <summary> {node.name} </summary>
          <svelte:self file_tree={node.children} />
        </details>
      </li>
    {:else}
      <li>
        <a>{node.name} </a>
      </li>
    {/if}
  {/each}
</ul>
