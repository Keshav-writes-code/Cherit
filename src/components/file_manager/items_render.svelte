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
  :global(summary::after) {
    content: none;
  }
  :global(summary::before) {
    content: "";
    width: 0.375rem;
    height: 0.375rem;
    box-shadow: inset 2px 2px;
    transform-origin: 50%;
    rotate: 135deg;
    transition-property: rotate;
    transition-duration: 0.2s;
  }
  :global(
      .menu :where(li > details[open] > summary):before,
      .menu :where(li > .menu-dropdown-toggle.menu-dropdown-show):before
    ) {
    rotate: 225deg;
  }
</style>
