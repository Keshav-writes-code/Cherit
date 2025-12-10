import { type FileNode } from '@/types';

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

// Deprecated: Sorting is now done in Rust backend.
// Keeping empty implementation if needed to avoid breaking imports,
// or I can remove it if I check usages.
// User asked to "remove sort_file_tree call from frontend".
// I will keep the export but make it do nothing, or remove it.
// Checking usages, `index.svelte` imports it. I should update `index.svelte`.
export function sort_file_tree(nodes: FileNode[]): FileNode[] {
    return nodes;
}
