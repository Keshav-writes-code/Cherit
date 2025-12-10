import { type FileNode, type GenericPath } from '@/types';
import { invoke } from '@tauri-apps/api/core';

export async function build_file_tree_from_fs({
  path,
  document_top_tree_uri,
}: GenericPath): Promise<FileNode[]> {
  try {
    return await invoke('build_file_tree', {
      path,
      documentTopTreeUri: document_top_tree_uri || null,
    });
  } catch (error) {
    console.error('Failed to build file tree:', error);
    throw error;
  }
}
