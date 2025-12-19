<script lang="ts">
  import type { Node } from '@/types';
  import animatedDetails from 'svelte-animated-details';
  import { delete_node, get_parent_path } from '@/lib/file_tree';
  import { context_menu } from '@/stores/context_menu.svelte';
  import {
    file_tree,
    focused_subtree,
    opened_filenode,
    root_path,
  } from '@/lib/states/ui_states.svelte';

  let {
    focused_directory = $bindable(),
    collapsed_state,
    hover_newnode_button,
    on_move,
  }: {
    collapsed_state: boolean;
    focused_directory: string | undefined;
    hover_newnode_button: boolean;
    on_move: (node: Node, new_parent_path: string) => void;
  } = $props();

  let expanded_nodes_ever: { [key: string]: boolean } = $state({});
  let expanded_state: { [key: string]: boolean } = $state({});

  let dragged_node: Node | null = $state(null);
  let drop_target: string | null = $state(null);

  $effect(() => {
    if (collapsed_state) return;
    expanded_nodes_ever = {};
  });
  function handle_node_right_click(
    e: MouseEvent,
    node: Node,
    parent_tree: Node[]
  ) {
    context_menu.open(e, [
      {
        label: 'Rename',
        icon_class: 'i-tabler:pencil size-4',
        action: () => navigator.clipboard.writeText(node.path),
      },
      {
        label: 'Delete',
        type: 'danger',
        icon_class: 'i-tabler:trash size-4',
        action: () => {
          if (!root_path.data) return;
          delete_node(node, root_path.data, parent_tree);
        },
      },
      { label: '', divider: true },
      {
        label: 'Open in system explorer',
        icon_class: 'i-tabler:arrow-up-right size-4',
        action: () => navigator.clipboard.writeText(node.path),
      },
    ]);
  }
  function handle_drag_start(e: DragEvent, node: Node) {
    dragged_node = node;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.path);
    }
  }

  function handle_drag_over(e: DragEvent, target_path: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragged_node) return;

    const current_parent = get_parent_path(dragged_node.path);
    if (dragged_node.path === target_path) return;
    if (current_parent === target_path) return;
    if (target_path.startsWith(dragged_node.path)) return;

    drop_target = target_path;
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  function handle_drop(e: DragEvent, target_path: string) {
    e.preventDefault();
    e.stopPropagation();
    if (dragged_node && drop_target === target_path) {
      on_move(dragged_node, target_path);
    }
    reset_dnd();
  }

  function reset_dnd() {
    dragged_node = null;
    drop_target = null;
  }
</script>

{#if root_path.data && file_tree.data}
  <ul
    ondragover={(e) => {
      if (typeof root_path.data === 'string' && e.currentTarget === e.target) {
        handle_drag_over(e, root_path.data);
      }
    }}
    ondrop={(e) => {
      if (typeof root_path.data === 'string') handle_drop(e, root_path.data);
    }}
    onscroll={() => {
      context_menu.close();
    }}
    class="
      {focused_directory == root_path.data.path &&
      'shadow-[inset_0_0_0_1px_var(--color-accent)]'}
      {drop_target === root_path.data?.path &&
      'bg-accent/10 outline-dashed outline-2 outline-accent'} 
      menu menu-sm h-full rounded-box relative w-full select-none overflow-y-auto flex-nowrap text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] text-ellipsis leading-relaxed tracking-wide flex before:content-none flex-col gap-0.5 pt-0.5"
  >
    {#each file_tree.data as node}
      <li>
        {#if node.is_directory}
          {@render folder_node(node, file_tree.data)}
        {:else}
          {@render file_button(node, file_tree.data)}
        {/if}
      </li>
    {:else}
      <div
        class="color-purple/60 i-tabler:file-text-spark size-15 mx-auto mt-20"
      ></div>
      <p class="text-base-content/40 text-pretty text-center mt-2 px-13">
        created notes will show up here
      </p>
    {/each}

    <button
      aria-label="Set Focus to root"
      class="min-h-30% grow"
      onclick={() => {
        focused_directory = root_path.data?.path;
        focused_subtree.set(file_tree.data);
      }}
    >
    </button>
  </ul>
{:else if !file_tree.data}
  <div
    class="color-[color-mix(in_srgb,var(--color-secondary)_50%,black)] i-tabler:folder-question size-15 mx-auto mt-20"
  ></div>
  <p class="text-base-content/40 text-pretty text-center mt-2 px-13">
    Select a folder to get started
  </p>
{/if}

{#snippet focus_directory_button(subtree: Node[])}
  {@const parent_path = get_parent_path(subtree[0].path)}
  <button
    aria-label="Set focused directory"
    class=" w-2 flex hover:bg-accent absolute start--1.75 top-3 bottom-3 transition-all rounded-0.7"
    onclick={() => {
      focused_directory = parent_path;
      focused_subtree.set(subtree);
    }}
  >
    <span
      class="w-1px h-full m-auto transition-all
        {parent_path == focused_directory
        ? 'bg-[var(--color-accent)] '
        : 'bg-[rgb(from_var(--color-base-content)_r_g_b_/_0.1)]'}
        "
    ></span>
  </button>
{/snippet}

{#snippet folder_node(node: Node, parent_node: Node[])}
  {@const is_focused_and_collapsed_and_hover =
    expanded_state[node.path] === false &&
    node.path === focused_directory &&
    hover_newnode_button}
  <details
    open={!collapsed_state}
    class="w-full {!is_focused_and_collapsed_and_hover && 'overflow-y-clip'} "
    use:animatedDetails={{
      duration: 100 - 10 + 10 * node.children.length,
    }}
  >
    {@render folder_button(
      node,
      is_focused_and_collapsed_and_hover,
      parent_node
    )}
    {#if expanded_nodes_ever[node.path] || false || !collapsed_state}
      {@render folder_content(node.children, node.path)}
    {/if}
  </details>
{/snippet}

{#snippet folder_content(nodes: Node[], parent_path: string)}
  {#if nodes.length}
    <ul
      ondragover={(e) => handle_drag_over(e, parent_path)}
      ondrop={(e) => handle_drop(e, parent_path)}
      class="
        flex before:content-none flex-col gap-0.5 pt-0.5 rounded-lg
        {drop_target === parent_path &&
        'bg-accent/10 outline-dashed outline-2 outline-accent '}
      "
    >
      {#each nodes as node}
        <li>
          {#if node.is_directory}
            {@render folder_node(node, nodes)}
          {:else}
            {@render file_button(node, nodes)}
          {/if}
        </li>
      {/each}
      {@render focus_directory_button(nodes)}
    </ul>
  {/if}
{/snippet}

{#snippet folder_button(
  node: Node,
  is_focused_and_collapsed_and_hover: boolean,
  parent_node: Node[]
)}
  <summary
    draggable="true"
    ondragstart={(e) => handle_drag_start(e, node)}
    ondragover={(e) => handle_drag_over(e, node.path)}
    ondrop={(e) => handle_drop(e, node.path)}
    ondragend={reset_dnd}
    oncontextmenu={(e) => handle_node_right_click(e, node, parent_node)}
    class="
      {is_focused_and_collapsed_and_hover &&
      'outline-solid outline-2 outline-accent'} 
      {drop_target === node.path &&
      (!expanded_state[node.path] || node.children.length === 0) &&
      'bg-accent/20 duration-0 outline-dashed outline-2 outline-accent z-50 '}
      py-0.75 hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)] rounded-md transition-colors"
    onmousedown={() => {
      expanded_nodes_ever[node.path] = true;
    }}
    onclick={(e) => {
      if (drop_target) return;
      expanded_state[node.path] = !expanded_state[node.path];
      if (e.target === e.currentTarget) {
        focused_directory = node.path;
        focused_subtree.set(node.children);
      }
    }}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key !== ' ') return;
      expanded_nodes_ever[node.path] = true;
    }}
  >
    {node.name}
  </summary>
{/snippet}

{#snippet file_button(node: Node, subtree: Node[])}
  <button
    draggable="true"
    ondragstart={(e) => handle_drag_start(e, node)}
    ondragend={reset_dnd}
    oncontextmenu={(e) => handle_node_right_click(e, node, subtree)}
    class="{opened_filenode.data?.path === node.path
      ? 'bg-base-content/10'
      : ''} 
      {dragged_node?.path === node.path ? 'opacity-50' : ''}
      py-0.75 w-full hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)] truncate block"
    onclick={(e) => {
      opened_filenode.data = node;
      if (e.target === e.currentTarget) {
        focused_directory = get_parent_path(node.path);
        focused_subtree.set(subtree);
      }
    }}
  >
    {node.name}
  </button>
{/snippet}

<style>
  :global(summary::after) {
    content: none;
  }
  :global(summary::before) {
    content: '';
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
