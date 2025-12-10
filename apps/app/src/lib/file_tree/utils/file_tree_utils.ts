import type { FileNode } from '@/types';

export function find_unused_name(
  base_name: string,
  subtree: FileNode[],
  is_directory: boolean
): string {
  let i = 0;
  while (
    subtree.some((n) => n.name === base_name && n.is_directory === is_directory)
  )
    base_name = `Untitled ${++i}`;
  return base_name;
}

export function sort_nodes(nodes: FileNode[]) {
  // Sort array in-place
  nodes.sort((a, b) => {
    if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}
