import { current_platform } from '@/misc_global_states.svelte';
import { type FileNode, type GenericPath } from '@/types';
export const get_parent_path = (p: string) => {
  const s = p.startsWith('content://') ? '%2F' : '/';
  const c = p.endsWith(s) ? p.slice(0, -s.length) : p;
  return c.slice(0, Math.max(0, c.lastIndexOf(s))) || (s === '/' ? '/' : p);
};

export function find_unused_name(
  base_name: string,
  parent_path: string,
  root_path: string,
  tree: FileNode[],
  is_directory: boolean
): string {
  let i = 0;
  while (exists(parent_path, base_name, root_path, is_directory, tree))
    base_name = `Untitled ${++i}`;
  return base_name;
}
export function exists(
  focused_path: string,
  node_name: string,
  root_path: string,
  is_directory: boolean,
  tree: FileNode[]
): boolean {
  const stack: FileNode[] = [
    { name: '', path: root_path, is_directory: true, children: tree },
  ];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.path === focused_path)
      return (
        node.is_directory &&
        node.children.some(
          (c) => c.name === node_name && c.is_directory === is_directory
        )
      );
    if (node.is_directory && node.children.length) stack.push(...node.children);
  }
  return false;
}
export function get_relative_path_parts(
  path: string,
  offset: string = ''
): string[] {
  const p = decodeURIComponent(path);
  const o = decodeURIComponent(offset);
  return p.replace(o, '').split(/[/\\]/).filter(Boolean);
}
export function sort_file_tree(nodes: FileNode[]): FileNode[] {
  // Sort array in-place
  nodes.sort((a, b) => {
    if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  // Recursively sort children in-place
  for (const node of nodes) {
    if (node.children?.length) {
      sort_file_tree(node.children);
    }
  }

  return nodes;
}
