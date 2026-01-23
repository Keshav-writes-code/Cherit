// @unocss-include
import { delete_node } from '@/lib/file_system';
import type { MenuItem } from '@/types';
import type { GenericPath, Node } from '@/types';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
export function get_desktop_context_menu(
  node: Node,
  parent_tree: Node[],
  root_path: { data: GenericPath | undefined },
  rename_node: { data: Node | undefined }
): MenuItem[] {
  return [
    {
      label: 'Rename',
      icon_class: 'i-tabler:pencil size-4',
      action: () => {
        rename_node.data = node;
      },
    },
    {
      label: 'Delete',
      type: 'danger',
      icon_class: 'i-tabler:trash size-4',
      action: async () => {
        if (!root_path.data) return;
        await delete_node(node, root_path.data, parent_tree);
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
export function get_mobile_context_menu(
  node: Node,
  parent_tree: Node[],
  root_path: { data: GenericPath | undefined },
  rename_node: { data: Node | undefined }
): MenuItem[] {
  return [
    {
      label: 'Rename',
      icon_class: 'i-tabler:pencil size-4',
      experimental: true,
      type: 'warning',
      tooltip: 'Rename on andorid is unstable',
      action: () => {
        rename_node.data = node;
      },
    },

    {
      label: 'Delete',
      type: 'danger',
      icon_class: 'i-tabler:trash size-4',
      action: async () => {
        if (!root_path.data) return;
        await delete_node(node, root_path.data, parent_tree);
      },
    },
  ];
}
