<script lang="ts">
  import type { FileNode } from "./build_file_tree";
  import ItemsRenderer from "@/components/file_manager/items_renderer.svelte";
  let {
    file_tree,
    root_path,
  }: { file_tree: FileNode[]; root_path: string | undefined } = $props();
  const isDirectChild = (r: string, f: string) =>
    f.replace(/\/+$/, "").startsWith(r.replace(/\/+$/, "")) &&
    f
      .replace(/\/+$/, "")
      .slice(r.replace(/\/+$/, "").length)
      .split("/")
      .filter((s) => s).length === 1;
</script>

{#if root_path && file_tree[0]}
  <ul
    class={isDirectChild(root_path, file_tree[0].path)
      ? "menu bg-base-200 h-full menu-sm bg-base-200 rounded-box relative w-full select-none"
      : ""}
  >
    {#each file_tree as node}
      {#if node.isDirectory}
        <li>
          <details open>
            <summary> {node.name} </summary>
            <ItemsRenderer file_tree={node.children} {root_path} />
          </details>
        </li>
      {:else}
        <li>
          <a>{node.name} </a>
        </li>
      {/if}
    {/each}
  </ul>
{/if}

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
