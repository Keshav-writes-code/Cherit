<script module lang="ts">
  let expanded_nodes_ever: { [key: string]: boolean } = $state({});
</script>

<script lang="ts">
  import type { FileNode } from "@/types";
  import ItemsRenderer from "@/components/file_manager/items_renderer.svelte";
  import { blur, fly } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import animatedDetails from "svelte-animated-details";
  let {
    opened_filenode = $bindable(),
    file_tree,
    root_path,
    collapsed_state,
    is_root = true,
  }: {
    opened_filenode: FileNode | undefined;
    file_tree: FileNode[];
    root_path: string | undefined;
    collapsed_state: boolean;
    is_root?: boolean;
  } = $props();
  $effect(() => {
    if (collapsed_state) return;
    expanded_nodes_ever = {};
  });
</script>

{#if root_path && file_tree.length}
  <ul
    class="{is_root
      ? 'menu menu-sm rounded-box relative w-full select-none flex-1 overflow-y-auto flex-nowrap text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] text-ellipsis leading-relaxed tracking-wide'
      : ''} flex flex-col gap-0.5 pt-0.5"
  >
    {#each file_tree as node (node.path)}
      <li in:fly={{ y: -10, duration: 300, easing: backOut }} out:blur>
        {#if node.isDirectory}
          <details
            open={!collapsed_state}
            class="w-full overflow-y-clip"
            use:animatedDetails={{
              duration: 100 - 10 + 10 * node.children.length,
            }}
          >
            <summary
              class="py-0.75 hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)]"
              onmousedown={() => {
                expanded_nodes_ever[node.path] = true;
              }}
              onkeydown={(e: KeyboardEvent) => {
                if (e.key !== " ") return;
                expanded_nodes_ever[node.path] = true;
              }}
            >
              {node.name}
            </summary>
            {#if expanded_nodes_ever[node.path] || false || !collapsed_state}
              <ItemsRenderer
                bind:opened_filenode
                file_tree={node.children}
                {root_path}
                {collapsed_state}
                is_root={false}
              />
            {/if}
          </details>
        {:else}
          <button
            class="{opened_filenode?.path === node.path
              ? 'bg-base-content/10'
              : ''} py-0.75 w-full hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)] truncate block"
            onclick={() => {
              opened_filenode = node;
            }}
            >{node.name}
          </button>
        {/if}
      </li>
    {/each}
  </ul>
{:else if is_root && !file_tree.length}
  <div
    class="color-purple/60 i-tabler:file-text-spark size-15 mx-auto mt-20"
  ></div>
  <p class="text-base-content/40 text-pretty text-center mt-2 px-13">
    created notes will show up here
  </p>
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
