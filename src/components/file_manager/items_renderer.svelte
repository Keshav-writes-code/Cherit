<script module lang="ts">
  const _expansionState: { [key: string]: boolean } = $state({});
</script>

<script lang="ts">
  import type { FileNode } from "@/types";
  import ItemsRenderer from "@/components/file_manager/items_renderer.svelte";
  let {
    opened_filenode = $bindable(),
    file_tree,
    root_path,
    collapsed_state,
  }: {
    opened_filenode: FileNode | undefined;
    file_tree: FileNode[];
    root_path: string | undefined;
    collapsed_state: boolean;
  } = $props();
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
    class="{isDirectChild(root_path, file_tree[0].path)
      ? 'menu menu-sm rounded-box relative w-full select-none flex-1 overflow-y-auto flex-nowrap text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] text-ellipsis leading-relaxed tracking-wide'
      : ''} flex flex-col gap-0.5 pt-0.5"
  >
    {#each file_tree as node}
      {#if node.isDirectory}
        <li>
          <details open={!collapsed_state} class="w-full">
            <summary
              class="py-0.75 hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)]"
              onclick={() => {
                _expansionState[node.path] = true;
              }}
            >
              {node.name}
            </summary>
            {#if _expansionState[node.path] || false || !collapsed_state}
              <ItemsRenderer
                bind:opened_filenode
                file_tree={node.children}
                {root_path}
                {collapsed_state}
              />
            {/if}
          </details>
        </li>
      {:else}
        <li>
          <button
            class="{opened_filenode?.path === node.path
              ? 'bg-base-content/10'
              : ''} py-0.75 w-full hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)] truncate block"
            onclick={() => {
              opened_filenode = node;
            }}
            >{node.name}
          </button>
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
    box-shadow: inset 2px 2px
      color-mix(in srgb, var(--color-base-content) 40%, black);
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
