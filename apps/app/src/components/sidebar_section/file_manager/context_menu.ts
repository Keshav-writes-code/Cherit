// @unocss-include
import { delete_node } from '@/lib/operations/file_tree';
import type { MenuItem, GenericPath, Node } from '@/lib/types';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
type Args = {
  node: Node;
  parent_subtree: Node[];
  workspace_root_path: { data: GenericPath | undefined };
  rename_node: { data: Node | undefined };
  input_rename_elem?: { data: HTMLInputElement | undefined };
};
export function get_desktop_context_menu({
  node,
  parent_subtree,
  workspace_root_path,
  rename_node,
  input_rename_elem,
}: Args): MenuItem[] {
  return [
    {
      label: 'Rename',
      icon_class: 'i-tabler:pencil size-4',
      action: () => {
        rename_node.data = node;
        setTimeout(() => {
          if (input_rename_elem?.data) input_rename_elem.data.focus();
        }, 0);
      },
    },
    {
      label: 'Delete',
      type: 'danger',
      icon_class: 'i-tabler:trash size-4',
      action: async () => {
        if (!workspace_root_path.data) return;
        await delete_node(node, workspace_root_path.data, parent_subtree);
      },
    },
    { label: '', divider: true },
    {
      label: 'Open in system explorer',
      icon_class: 'i-tabler:arrow-up-right size-4',
      action: async () => {
        await revealItemInDir(node.path);
      },
    },
  ];
}
export function get_mobile_context_menu({
  node,
  parent_subtree,
  workspace_root_path,
  rename_node,
  input_rename_elem,
}: Args): MenuItem[] {
  return [
    {
      label: 'Rename',
      icon_class: 'i-tabler:pencil size-4',
      experimental: true,
      type: 'warning',
      tooltip: 'Rename on andorid is unstable',
      action: () => {
        rename_node.data = node;
        setTimeout(() => {
          if (input_rename_elem?.data) input_rename_elem.data.focus();
        }, 0);
      },
    },

    {
      label: 'Delete',
      type: 'danger',
      icon_class: 'i-tabler:trash size-4',
      action: async () => {
        if (!workspace_root_path.data) return;
        await delete_node(node, workspace_root_path.data, parent_subtree);
      },
    },
  ];
}
