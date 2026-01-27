<script lang="ts">
  import type { Node, MenuItem } from '@/types';
  import animatedDetails from 'svelte-animated-details';
  import {
    current_platform_type,
    get_parent_path,
    rename_node,
  } from '@/lib/file_system';
  import {
    opened_filenode,
    workspace_root_path,
    context_menu,
  } from '@/lib/global_states/index.svelte';
  import {
    get_desktop_context_menu,
    get_mobile_context_menu,
  } from './context_menu';
  import { flip } from 'svelte/animate';
  import {
    file_tree,
    focused_subtree,
    is_filetree_loading,
    input_rename_elem,
    rename_sel_node,
    outlined_node,
    expand_override_global,
    expand_override_fine_grain,
    hover_newnode_button,
  } from './states.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { toast } from 'svelte-sonner';
  import { boolean } from 'zod';

  let {
    focused_directory_path = $bindable(),
    on_move,
  }: {
    focused_directory_path: string | undefined;
    on_move: (node: Node, new_parent_path: string) => void;
  } = $props();

  let child_render_paths_ever = new SvelteSet<string>();
  let child_render_paths = new SvelteSet<string>();

  let dragged_node: Node | null = $state(null);
  let drop_target: string | null = $state(null);

  $effect(() => {
    if (expand_override_global.data) return;
    child_render_paths_ever.clear();
  });

  function handle_node_right_click(
    e: MouseEvent,
    node: Node,
    parent_subtree: Node[]
  ) {
    outlined_node.data = node;
    let context_menu_items: MenuItem[];
    let args = {
      node,
      parent_subtree,
      workspace_root_path,
      rename_node: rename_sel_node,
      input_rename_elem,
    };
    if (current_platform_type == 'desktop')
      context_menu_items = get_desktop_context_menu(args);
    else context_menu_items = get_mobile_context_menu(args);

    context_menu.open(e, context_menu_items);
    context_menu.run_on_close(() => {
      outlined_node.data = undefined;
    });
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

{#if workspace_root_path.data && file_tree.data}
  <ul
    ondragover={(e) => {
      if (
        typeof workspace_root_path.data === 'string' &&
        e.currentTarget === e.target
      ) {
        handle_drag_over(e, workspace_root_path.data);
      }
    }}
    ondrop={(e) => {
      if (typeof workspace_root_path.data === 'string')
        handle_drop(e, workspace_root_path.data);
    }}
    onscroll={() => {
      context_menu.close();
    }}
    class="
      {focused_directory_path == workspace_root_path.data.path &&
      'shadow-[inset_0_0_0_1px_var(--color-accent)]'}
      {drop_target === workspace_root_path.data?.path &&
      'bg-accent/10 outline-dashed outline-2 outline-accent'} 
      {current_platform_type == 'mobile' ? ' menu-lg pt-3' : ' pt-2 menu-sm'}
      menu h-full rounded-box relative w-full select-none overflow-y-auto flex-nowrap text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] text-ellipsis leading-relaxed tracking-wide flex before:content-none flex-col gap-0.5 pt-0.5"
  >
    {#each file_tree.data as node (node.path)}
      <li
        animate:flip={{ duration: 300 }}
        class="{outlined_node.data == node &&
          'outline-[color-mix(in_srgb,var(--color-base-content)_30%,black)] outline-2 outline-solid '} rounded-field"
      >
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
        focused_directory_path = workspace_root_path.data?.path;
        focused_subtree.set(file_tree.data);
        outlined_node.data = undefined;
      }}
    >
    </button>
  </ul>
{:else if is_filetree_loading.data}
  <div class=" skeleton h-full rounded-box w-full"></div>
{:else if !file_tree.data}
  <div
    class="color-[color-mix(in_srgb,var(--color-secondary)_50%,black)] i-tabler:folder-question size-15 mx-auto mt-20"
  ></div>
  <p class="text-base-content/40 text-pretty text-center mt-2 px-13">
    Select a folder to get started
  </p>
{/if}

{#snippet folder_node(node: Node, parent_subtree: Node[])}
  {@const is_focused_and_collapsed_and_hover =
    !child_render_paths.has(node.path) &&
    node.path === focused_directory_path &&
    hover_newnode_button.data}
  {@const animate_duration = 100 - 10 + 10 * node.children.length}
  <details
    open={expand_override_global.data ||
      expand_override_fine_grain.has(node.path)}
    class="w-full {!is_focused_and_collapsed_and_hover && 'overflow-y-clip'} "
    use:animatedDetails={{ duration: animate_duration }}
  >
    {@render folder_button(
      node,
      is_focused_and_collapsed_and_hover,
      parent_subtree,
      animate_duration
    )}
    {#if child_render_paths_ever.has(node.path) || expand_override_global.data}
      {@render folder_content(node.children, node.path)}
    {/if}
  </details>
{/snippet}

{#snippet folder_button(
  node: Node,
  is_focused_and_collapsed_and_hover: boolean,
  parent_subtree: Node[],
  animate_duration: number
)}
  <summary
    draggable="true"
    ondragstart={(e) => handle_drag_start(e, node)}
    ondragover={(e) => handle_drag_over(e, node.path)}
    ondrop={(e) => handle_drop(e, node.path)}
    ondragend={reset_dnd}
    oncontextmenu={(e) => handle_node_right_click(e, node, parent_subtree)}
    class="
      {is_focused_and_collapsed_and_hover &&
      'outline-solid outline-2 outline-accent'} 
      {drop_target === node.path &&
      (!child_render_paths.has(node.path) || node.children.length === 0) &&
      'bg-accent/20 duration-0 outline-dashed outline-2 outline-accent z-50 '}
      py-0.75 hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)] rounded-field transition-colors truncate overflow-clip"
    onmousedown={() => {
      child_render_paths_ever.add(node.path);
    }}
    onclick={(e) => {
      child_render_paths.delete(node.path);

      // toggle node expand state
      expand_override_fine_grain.has(node.path)
        ? setTimeout(() => {
            expand_override_fine_grain.delete(node.path);
          }, animate_duration)
        : expand_override_fine_grain.add(node.path);

      if (e.target === e.currentTarget) {
        focused_directory_path = node.path;
        focused_subtree.set(node.children);
      }
    }}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key !== ' ') return;
      child_render_paths_ever.add(node.path);
      // toggle node expand state
      expand_override_fine_grain.has(node.path)
        ? setTimeout(() => {
            expand_override_fine_grain.delete(node.path);
          }, animate_duration)
        : expand_override_fine_grain.add(node.path);
    }}
    {@attach (e) => e.scrollIntoView()}
  >
    {@render node_button_content(node, parent_subtree)}
  </summary>
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
      {#each nodes as node (node.path)}
        <li
          animate:flip={{ duration: 300 }}
          class="{outlined_node.data == node &&
            'outline-[color-mix(in_srgb,var(--color-base-content)_30%,black)] outline-2 outline-solid '} rounded-field"
        >
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

{#snippet file_button(node: Node, parent_subtree: Node[])}
  <button
    draggable="true"
    ondragstart={(e) => handle_drag_start(e, node)}
    ondragend={reset_dnd}
    oncontextmenu={(e) => handle_node_right_click(e, node, parent_subtree)}
    class="
    {opened_filenode.data?.path === node.path && 'bg-base-content/10'} 
      {dragged_node?.path === node.path ? 'opacity-50' : ''}
      py-0.75 w-full hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)] truncate block"
    onclick={(e) => {
      opened_filenode.data = node;
      if (e.target === e.currentTarget) {
        focused_directory_path = get_parent_path(node.path);
        focused_subtree.set(parent_subtree);
      }
    }}
    {@attach (e) => e.scrollIntoView()}
  >
    {@render node_button_content(node, parent_subtree)}
  </button>
{/snippet}

{#snippet node_button_content(node: Node, parent_subtree: Node[])}
  {#if rename_sel_node.data == node}
    {@const already_renamed:{ data:boolean } = { data:false }}
    {@const new_name:{ data:string } = { data:node.name }}
    {@const rename_and_handle_ui_state = async () => {
      if (!workspace_root_path.data) return;
      try {
        await rename_node({
          node,
          new_name: new_name.data,
          parent_subtree,
          document_top_tree_uri: workspace_root_path.data.document_top_tree_uri,
        });
        rename_sel_node.data = undefined;
        if (outlined_node.data == node) outlined_node.data = undefined;
        if (node.is_directory) {
          focused_directory_path = node.path;
          focused_subtree.set(node.children);
          child_render_paths_ever.add(node.path);
          child_render_paths.add(node.path);
          expand_override_fine_grain.add(node.path);
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error('Error Renaming Node', { description: error.message });
        }
      }
    }}
    <input
      type="text"
      bind:value={new_name.data}
      bind:this={input_rename_elem.data}
      class=" [all:_unset]"
      onkeydown={async (e: KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        // if new name not the same as old name
        if (!(new_name.data == node.name)) await rename_and_handle_ui_state();
        else rename_sel_node.data = undefined;
        already_renamed.data = true;
      }}
      onfocusout={async () => {
        // if new name not the same as old name and if onkeydown hasn't already ran the rename
        if (!already_renamed.data && !(new_name.data == node.name))
          rename_and_handle_ui_state();
      }}
    />
  {:else}
    {node.name}
  {/if}
{/snippet}

{#snippet focus_directory_button(subtree: Node[])}
  {@const parent_path = get_parent_path(subtree[0].path)}
  <button
    aria-label="Set focused directory"
    class=" w-2 flex hover:bg-accent absolute start--1.75 top-3 bottom-3 transition-all rounded-0.7"
    onclick={() => {
      focused_directory_path = parent_path;
      focused_subtree.set(subtree);
    }}
  >
    <span
      class="w-1px h-full m-auto transition-all
        {parent_path == focused_directory_path
        ? 'bg-[var(--color-accent)] '
        : 'bg-[rgb(from_var(--color-base-content)_r_g_b_/_0.1)]'}
        "
    ></span>
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
