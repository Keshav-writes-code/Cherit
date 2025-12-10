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

// These functions are no longer needed but kept if needed for other parts of the app
// or we can remove them if we are sure they are unused.
// Based on the task, we are replacing the logic.
// I'll comment them out or remove them if I'm sure.
// The user said "replace it with the js build file tree function".
// I'll keep the exports but empty or commented if I want to be safe, or just remove them.
// "and replace it with the js build file tree function" -> Replace the implementation of `build_file_tree_from_fs`.
// I'll remove the helper functions as they were only used by `build_file_tree_from_fs`.

export async function transform_entries_to_filenode(
  entries: any[],
  base_dir_path: string
): Promise<FileNode[]> {
    // Deprecated: logic moved to Rust
    return [];
}

export async function transform_android_entries_to_filenode(
  entries: any[],
  base_dir_path: string
): Promise<FileNode[]> {
    // Deprecated: logic moved to Rust
    return [];
}
