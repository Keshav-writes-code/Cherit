import {
  readDir,
  type DirEntry,
} from '@tauri-apps/plugin-fs';
import { type FileNode, type GenericPath } from '@/types';
import { current_platform } from '@/misc_global_states.svelte';
import {
  AndroidFs,
  type AndroidEntryMetadataWithUri,
} from 'tauri-plugin-android-fs-api';
import { join } from '@tauri-apps/api/path';
import * as Logic from './file_tree_logic';

export async function build_file_tree_from_fs(
  path: GenericPath
): Promise<FileNode[]> {
  const fetcher: Logic.NodeFetcher = async (p: GenericPath) => {
    let entries: DirEntry[] | AndroidEntryMetadataWithUri[];
    if (current_platform == 'android') {
      if (!p.document_top_tree_uri)
        throw new Error('Document top tree URI is not set');
      entries = await AndroidFs.readDir({
        uri: p.path,
        documentTopTreeUri: p.document_top_tree_uri,
      });
      return Logic.transform_android_entries_to_filenode(entries, p.path);
    } else {
      entries = await readDir(p.path);
      return Logic.transform_entries_to_filenode(entries, p.path, join);
    }
  };

  return Logic.build_tree_recursive(path, fetcher);
}

// Wrapper for existing consumers of transform_entries_to_filenode to default to Tauri join
export async function transform_entries_to_filenode(
    entries: DirEntry[],
    base_dir_path: string
  ): Promise<FileNode[]> {
      return Logic.transform_entries_to_filenode(entries, base_dir_path, join);
  }
