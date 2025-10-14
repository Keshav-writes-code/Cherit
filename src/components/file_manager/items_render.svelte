<script lang="ts">
  import type { FileNode } from "./build_file_tree";
  import ItemsRenderer2 from "./items_renderer_2.svelte";
  let { file_tree }: { file_tree: FileNode[] } = $props();
</script>

<ul class="menu menu-sm bg-base-200 rounded-box relative w-full">
  {#each file_tree as node}
    {#if node.isDirectory}
      <li>
        <details open>
          <summary> {node.name} </summary>
          <ItemsRenderer2 file_tree={node.children} />
        </details>
      </li>
    {:else}
      <li>
        <a>{node.name} </a>
      </li>
    {/if}
  {/each}
</ul>

<style>
  /* Minimal accordion animation for <details> with a wrapper */
  details > .content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 250ms ease;
  }
  details[open] > .content {
    grid-template-rows: 1fr;
  }
  details > .content > * {
    overflow: hidden;
  }

  /* Optional: make summary look clickable */
  details > summary {
    cursor: pointer;
  }
</style>
