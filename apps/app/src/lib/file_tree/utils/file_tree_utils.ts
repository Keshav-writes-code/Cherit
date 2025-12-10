import { invoke } from '@tauri-apps/api/core';
import type { FileNode } from '@/types';
import { toast } from 'svelte-sonner';

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

let is_sorting = false;

export async function sort_file_tree(nodes: FileNode[]) {
    if (is_sorting) return;
    is_sorting = true;
    try {
        const sorted = await invoke<FileNode[]>('sort_file_tree', { nodes });

        // Only update if changes detected (simple JSON compare to avoid loops if strict equality not maintained)
        // Optimization: checking only length and some properties might be faster but stringify is safest for now.
        // Actually, if we just update, Svelte effect might run again.
        // If sorting produces identical structure, stringify will match.

        if (JSON.stringify(nodes) !== JSON.stringify(sorted)) {
             nodes.length = 0;
             nodes.push(...sorted);
        }
    } catch (e) {
        toast.error('Failed to sort file tree: ' + e);
        console.error(e);
    } finally {
        is_sorting = false;
    }
}
