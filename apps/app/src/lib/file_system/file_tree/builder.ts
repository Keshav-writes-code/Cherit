import { type Node, type GenericPath } from '@/types';
import { invoke } from '@tauri-apps/api/core';

export async function build_file_tree_from_fs({
  path,
  document_top_tree_uri,
}: GenericPath): Promise<Node[]> {
  return await invoke('build_file_tree', {
    path,
    documentTopTreeUri: document_top_tree_uri || null,
  });
}
