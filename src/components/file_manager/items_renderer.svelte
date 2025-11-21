<script module lang="ts">
  let expanded_nodes_ever: { [key: string]: boolean } = $state({});
  let expanded_state: { [key: string]: boolean } = $state({});
</script>

<script lang="ts">
  import type { FileNode } from "@/types";
  import ItemsRenderer from "@/components/file_manager/items_renderer.svelte";
  import { blur, fly } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import animatedDetails from "svelte-animated-details";
  import { get_parent_path } from "./file_tree_functions";
  let {
    opened_filenode = $bindable(),
    focused_directory = $bindable(),
    file_tree,
    root_path,
    collapsed_state,
    is_root = true,
    hover_newfile_button,
  }: {
    opened_filenode: FileNode | undefined;
    file_tree: FileNode[];
    root_path: string | undefined;
    collapsed_state: boolean;
    is_root?: boolean;
    focused_directory: string | undefined;
    hover_newfile_button: boolean;
  } = $props();
  $effect(() => {
    if (collapsed_state) return;
    expanded_nodes_ever = {};
  });
</script>

{#if root_path && file_tree.length}
  <ul
    class="
    {is_root &&
      'menu menu-sm rounded-box relative w-full select-none flex-1 overflow-y-auto flex-nowrap text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] text-ellipsis leading-relaxed tracking-wide'}
    {get_parent_path(file_tree[0].path) == focused_directory &&
      ' before:opacity-100 before:bg-[var(--color-accent)] '}
    flex flex-col gap-0.5 pt-0.5 before:transition-all"
  >
    {#each file_tree as node (node.path)}
      <li
        onclick={(e) => {
          if (e.target === e.currentTarget.querySelector(":scope > button")) {
            focused_directory = get_parent_path(node.path);
          } else if (
            e.target === e.currentTarget.querySelector("details > summary")
          ) {
            focused_directory = node.path;
          }
        }}
        in:fly={{ y: -10, duration: 300, easing: backOut }}
        out:blur
      >
        {#if node.isDirectory}
          {@const is_focused_and_collapsed_and_hover =
            expanded_state[node.path] === false &&
            node.path === focused_directory &&
            hover_newfile_button}
          <details
            open={!collapsed_state}
            class="w-full {!is_focused_and_collapsed_and_hover &&
              'overflow-y-clip'}"
            use:animatedDetails={{
              duration: 100 - 10 + 10 * node.children.length,
            }}
          >
            <summary
              class="
              {is_focused_and_collapsed_and_hover &&
                'outline-solid outline-2 outline-accent'}
               py-0.75 hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)]"
              onmousedown={() => {
                expanded_nodes_ever[node.path] = true;
              }}
              onclick={() =>
                (expanded_state[node.path] = !expanded_state[node.path])}
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
                bind:focused_directory
                file_tree={node.children}
                {root_path}
                {collapsed_state}
                {hover_newfile_button}
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
