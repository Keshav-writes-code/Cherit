import { readDir, type DirEntry } from '@tauri-apps/plugin-fs';
import { type FileNode, type GenericPath } from '@/types';
import {
  AndroidFs,
  type AndroidEntryMetadataWithUri,
} from 'tauri-plugin-android-fs-api';
import { join } from '@tauri-apps/api/path';
import { current_platform } from './utils';

export async function build_file_tree_from_fs({
  path,
  document_top_tree_uri,
}: GenericPath): Promise<FileNode[]> {
  let entries: DirEntry[] | AndroidEntryMetadataWithUri[] | undefined;
  let base_nodes: FileNode[] | undefined;

  if (current_platform == 'android') {
    if (!document_top_tree_uri)
      throw new Error('Document top tree URI is not set');
    entries = await AndroidFs.readDir({
      uri: path,
      documentTopTreeUri: document_top_tree_uri,
    });
    base_nodes = await transform_android_entries_to_filenode(entries, path);
  } else {
    entries = await readDir(path);
    base_nodes = await transform_entries_to_filenode(entries, path);
  }

  const nodes = await Promise.all(
    base_nodes.map(async (n) => {
      if (!n.is_directory) return n;
      const children = await build_file_tree_from_fs({
        path: n.path,
        document_top_tree_uri,
      });
      return {
        ...n,
        children,
      };
    })
  );

  return nodes;
}
export async function transform_entries_to_filenode(
  entries: DirEntry[],
  base_dir_path: string
): Promise<FileNode[]> {
  const nodes = await Promise.all(
    entries
      .filter(
        (entry) =>
          (entry.isDirectory && !entry.name.startsWith('.')) ||
          entry.name.endsWith('.md')
      )
      .map(async (entry) => ({
        name: entry.name.replace(/\.md$/, ''),
        path: await join(base_dir_path, entry.name),
        is_directory: entry.isDirectory,
        children: [],
      }))
  );
  return nodes;
}
export async function transform_android_entries_to_filenode(
  entries: AndroidEntryMetadataWithUri[],
  base_dir_path: string
): Promise<FileNode[]> {
  const nodes = await Promise.all(
    entries
      .filter(
        (entry) =>
          (entry.type === 'Dir' && !entry.name.startsWith('.')) ||
          entry.name.endsWith('.md')
      )
      .map(async (entry) => ({
        name: entry.name.replace(/\.md$/, ''),
        path: `${base_dir_path}%2F${encodeURIComponent(entry.name)}`,
        is_directory: entry.type === 'Dir',
        children: [],
      }))
  );
  return nodes;
}
