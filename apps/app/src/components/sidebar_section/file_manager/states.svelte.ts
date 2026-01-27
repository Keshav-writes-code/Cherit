import { workspace_root_path } from '@/lib/global_states/index.svelte';
import { SvelteSet } from 'svelte/reactivity';
import type { Node } from '@/types';

// Main File tree
export const file_tree: { data: Node[] | undefined } = $state({
  data: undefined,
});

// Loading state of filetree
export const is_filetree_loading: { data: boolean } = $state({ data: false });

class FocusedSubtree {
  data = $derived(file_tree.data);
  set(tree: Node[] | undefined) {
    this.data = tree;
  }
}

// a Refrence to the Original filetree for quick file tree realted small operations
export const focused_subtree = new FocusedSubtree();

// node to be renamed
export let rename_sel_node: { data: Node | undefined } = $state({
  data: undefined,
});

// element represnting the input tag for rename
export let input_rename_elem: { data: HTMLInputElement | undefined } = $state({
  data: undefined,
});

// node that is focused using right click (on desktop) or longpress (on mobile)
export let outlined_node: { data: Node | undefined } = $state({
  data: undefined,
});

export const expand_override_global: { data: boolean } = $state({
  data: false,
});
export const expand_override_fine_grain = new SvelteSet<string>();

export const hover_newnode_button: { data: boolean } = $state({ data: false });
