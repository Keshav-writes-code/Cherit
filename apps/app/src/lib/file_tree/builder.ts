import { type Node, type GenericPath } from '@/types';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'svelte-sonner';

export async function build_file_tree_from_fs({
  path,
  document_top_tree_uri,
}: GenericPath): Promise<Node[]> {
  try {
    return await invoke('build_file_tree', {
      path,
      documentTopTreeUri: document_top_tree_uri || null,
    });
  } catch (error) {
    console.error('Failed to build file tree:', error);
    const description =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);
    toast.error('Failed to build file tree', { description });
    throw error;
  }
}
