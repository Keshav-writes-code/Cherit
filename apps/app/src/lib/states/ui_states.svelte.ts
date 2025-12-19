import type { Node, GenericPath } from '@/types';

export const root_path: { data: GenericPath | undefined } = $state({
  data: undefined,
});
export const opened_filenode: { data: Node | undefined } = $state({
  data: undefined,
});
export const file_tree: { data: Node[] | undefined } = $state({
  data: undefined,
});

class FocusedSubtree {
  data = $derived(file_tree.data);
  set(tree: Node[] | undefined) {
    this.data = tree;
  }
}
export const focused_subtree = new FocusedSubtree();

export let root_folder_picker_dialog_state: { open: boolean } = $state({
  open: false,
});
